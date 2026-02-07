import { SubscriptionStatus } from "@/constant/schema.client";
import { Network } from "@/db";
import * as StellarSDK from "@stellar/stellar-sdk";
import { Result } from "@stellartools/core";

export class SorobanContractApi {
  private CONTRACT_ID = process.env.SUBSCRIPTION_CONTRACT_ID!;
  private server: StellarSDK.rpc.Server;

  private contract: StellarSDK.Contract;
  private networkPassphrase: string;
  private sourceKeypair: StellarSDK.Keypair;

  constructor(network: Network, sourceSecret: string) {
    this.networkPassphrase = network === "testnet" ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC;
    this.server = new StellarSDK.rpc.Server(
      network === "testnet" ? process.env.RPC_URL_TESTNET! : process.env.RPC_URL_MAINNET!
    );
    this.sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    this.contract = new StellarSDK.Contract(this.CONTRACT_ID);
  }

  async createSubscription(params: {
    customerAddress: string;
    productId: string;
    amount: number;
    periodStart: number;
    periodEnd: number;
  }): Promise<Result<string, Error>> {
    const operation = this.contract.call(
      "create_subscription",
      StellarSDK.nativeToScVal(params.customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(params.productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(params.amount * 100000000, { type: "i128" }),
      StellarSDK.nativeToScVal(params.periodEnd, { type: "u64" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );

    return await this.invoke(operation);
  }

  async pauseSubscription(customerAddress: string, productId: string): Promise<void> {
    const operation = this.contract.call(
      "pause_subscription",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );
    const result = await this.invoke(operation);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }

  async resumeSubscription(customerAddress: string, productId: string): Promise<void> {
    const operation = this.contract.call(
      "resume_subscription",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );
    const result = await this.invoke(operation);
    if (result.isErr()) throw new Error(result.error.message);
    return result.value;
  }

  async cancelSubscription(customerAddress: string, productId: string) {
    const operation = this.contract.call(
      "cancel_subscription",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );

    return await this.invoke(operation);
  }

  async getSubscription(customerAddress: string, productId: string) {
    const operation = this.contract.call(
      "get_subscription",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "symbol" })
    );

    return await this.invoke(operation, { readOnly: true });
  }

  async updateSubscription(
    customerAddress: string,
    productId: string,
    status: SubscriptionStatus | null,
    periodDuration: number | null,
    periodEnd: number | null
  ): Promise<Result<string, Error>> {
    const operation = this.contract.call(
      "update_subscription",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(status, { type: "status" }),
      StellarSDK.nativeToScVal(periodDuration, { type: "u64" }),
      StellarSDK.nativeToScVal(periodEnd, { type: "u64" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );

    return await this.invoke(operation);
  }

  async charge(
    customer: string,
    productId: string
  ): Promise<
    Result<
      {
        hash: string;
        events: Array<{
          topic: string;
          topics: string[];
          data: { amount: string; periodEnd: string };
          success: boolean;
        }>;
      },
      Error
    >
  > {
    const operation = this.contract.call(
      "charge",
      StellarSDK.nativeToScVal(customer, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );
    return await this.invoke(operation);
  }

  private async invoke(
    operation: StellarSDK.xdr.Operation,
    options: { readOnly?: boolean } = {}
  ): Promise<Result<any, Error>> {
    try {
      // 1. Prepare Base Transaction
      const source = await this.server.getAccount(this.sourceKeypair.publicKey());
      let tx = new StellarSDK.TransactionBuilder(source, {
        fee: StellarSDK.BASE_FEE, // Base fee, will be adjusted by simulation
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // 2. Simulate
      const simulation = await this.server.simulateTransaction(tx);
      if (StellarSDK.rpc.Api.isSimulationError(simulation)) {
        return Result.err(new Error(`Simulation failed: ${simulation.error}`));
      }

      // If read-only, we stop here and return the ScVal
      if (options.readOnly) {
        return Result.ok(simulation.result?.retval);
      }

      // 3. Assemble & Sign (Adds footprint/resources from simulation)
      tx = StellarSDK.rpc.assembleTransaction(tx, simulation).build();
      tx.sign(this.sourceKeypair);

      // 4. Send to RPC
      const response = await this.server.sendTransaction(tx);
      if (response.status !== "PENDING") {
        return Result.err(new Error(`Transaction submission failed: ${response.status}`));
      }

      return Result.ok(await this.pollForTransaction(response.hash));
    } catch (e) {
      if (e instanceof Error) return Result.err(e);
      return Result.err(new Error(String(e)));
    }
  }

  private async pollForTransaction(hash: string, attempts = 10): Promise<Result<any, Error>> {
    for (let i = 0; i < attempts; i++) {
      const res = await this.server.getTransaction(hash);

      if (res.status === "SUCCESS") {
        const rawEvents = res.events?.contractEventsXdr?.flat() ?? [];
        const parsedEvents = rawEvents.map((eventXdr) => {
          const event =
            typeof eventXdr == "string" ? StellarSDK.xdr.ContractEvent.fromXDR(eventXdr, "base64") : eventXdr;

          // 3. Extract topics and data
          // Topics is an array of ScVals (usually the first one is the Symbol/Event Name)
          const topics = event
            .body()
            .v0()
            .topics()
            .map((t) => StellarSDK.scValToNative(t));

          const data = StellarSDK.scValToNative(event.body().v0().data());

          return { topic: topics[0], topics, data, success: true };
        });

        return Result.ok({ hash, events: parsedEvents });
      }

      if (res.status === "FAILED") {
        return Result.ok({ hash, events: [], success: false });
      }

      // Delay for 10s, expected to be resolved after 10 * 10s = 100s (1m40s)
      await new Promise((r) => setTimeout(r, 10 * 1000));
    }

    console.error(`Transaction polling timed out for hash: ${hash}`);
    return Result.err(new Error("Transaction polling timed out"));
  }
}
