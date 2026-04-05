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

  /**
   * Builds and simulates a token allowance approval transaction for the customer to sign.
   * The customer must approve the subscription engine as a spender before `startSubscription` can be called.
   * Returns a prepared (simulated + resource-assembled) XDR ready for wallet signing.
   */
  async buildApprovalXdr(params: {
    customerAddress: string;
    tokenContractId: string;
    amount: bigint;
  }): Promise<Result<string, Error>> {
    try {
      const latestLedger = await this.server.getLatestLedger();
      // ~6 months worth of ledgers at 5s/ledger
      const expirationLedger = latestLedger.sequence + 2_628_000;

      const tokenContract = new StellarSDK.Contract(params.tokenContractId);
      const operation = tokenContract.call(
        "approve",
        StellarSDK.nativeToScVal(params.customerAddress, { type: "address" }),
        StellarSDK.nativeToScVal(this.CONTRACT_ID, { type: "address" }),
        StellarSDK.nativeToScVal(params.amount, { type: "i128" }),
        StellarSDK.nativeToScVal(expirationLedger, { type: "u32" })
      );

      const source = await this.server.getAccount(params.customerAddress);
      const tx = new StellarSDK.TransactionBuilder(source, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(300)
        .build();

      const simulation = await this.server.simulateTransaction(tx);

      if (StellarSDK.rpc.Api.isSimulationError(simulation)) {
        return Result.err(new Error(`Approval simulation failed: ${simulation.error}`));
      }

      const prepared = StellarSDK.rpc.assembleTransaction(tx, simulation).build();

      const envelope = StellarSDK.xdr.TransactionEnvelope.fromXDR(prepared.toXDR(), "base64");
      const ops = envelope.v1().tx().operations();

      for (const op of ops) {
        console.log("[buildApprovalXdr] op type:", op.body().switch().name);
        if (op.body().switch().name !== "invokeHostFunction") continue;

        const hostFnOp = op.body().invokeHostFunctionOp();
        const before = hostFnOp.auth().map((e) => e.credentials().switch().name);
        console.log("[buildApprovalXdr] auth credential types BEFORE patch:", before);

        const patchedAuth = hostFnOp.auth().map((entry) => {
          if (entry.credentials().switch().name !== "sorobanCredentialsAddress") return entry;
          return new StellarSDK.xdr.SorobanAuthorizationEntry({
            credentials: StellarSDK.xdr.SorobanCredentials.sorobanCredentialsSourceAccount(),
            rootInvocation: entry.rootInvocation(),
          });
        });
        hostFnOp.auth(patchedAuth);

        const after = patchedAuth.map((e) => e.credentials().switch().name);
        console.log("[buildApprovalXdr] auth credential types AFTER patch:", after);
      }

      const finalXdr = envelope.toXDR().toString("base64");
      console.log("[buildApprovalXdr] final XDR length:", finalXdr.length, "source:", params.customerAddress);
      return Result.ok(finalXdr);
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Submits a wallet-signed Soroban transaction to the RPC and polls for the result.
   */
  async submitSignedSorobanTransaction(signedXDR: string): Promise<Result<{ hash: string }, Error>> {
    try {
      const tx = StellarSDK.TransactionBuilder.fromXDR(signedXDR, this.networkPassphrase);
      const response = await this.server.sendTransaction(tx);
      if (response.status !== "PENDING") {
        return Result.err(new Error(`Soroban tx submission failed: ${response.status}`));
      }
      const pollResult = await this.pollForTransaction(response.hash);
      if (pollResult.isErr()) return Result.err(pollResult.error);
      return Result.ok({ hash: response.hash });
    } catch (e) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Registers a subscription on-chain and executes the first payment via transfer_from.
   * Customer must have already approved the engine contract as a spender.
   * The backend keypair (sourceSecret) acts as the caller.
   */
  async startSubscription(params: {
    customerAddress: string;
    merchantAddress: string;
    tokenContractId: string;
    productId: string;
    amountStroops: bigint;
    durationSeconds: number;
  }): Promise<Result<{ hash: string; events: Array<any>; customerWalletAddress: string }, Error>> {
    const operation = this.contract.call(
      "start",
      StellarSDK.nativeToScVal(params.customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(params.merchantAddress, { type: "address" }),
      StellarSDK.nativeToScVal(params.tokenContractId, { type: "address" }),
      StellarSDK.nativeToScVal(params.productId, { type: "string" }),
      StellarSDK.nativeToScVal(params.amountStroops, { type: "i128" }),
      StellarSDK.nativeToScVal(BigInt(params.durationSeconds), { type: "u64" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );

    return await this.invoke(operation);
  }

  async pauseSubscription(customerAddress: string, productId: string) {
    const operation = this.contract.call(
      "pause",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "string" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );
    return await this.invoke(operation);
  }

  async resumeSubscription(customerAddress: string, productId: string) {
    const operation = this.contract.call(
      "resume",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "string" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );
    return await this.invoke(operation);
  }

  async cancelSubscription(customerAddress: string, productId: string) {
    const operation = this.contract.call(
      "cancel",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "string" }),
      StellarSDK.nativeToScVal(this.sourceKeypair.publicKey(), { type: "address" })
    );

    return await this.invoke(operation);
  }

  async getSubscription(customerAddress: string, productId: string) {
    const operation = this.contract.call(
      "get_subscription",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "string" })
    );

    return await this.invoke(operation, { readOnly: true });
  }

  async updateSubscription(
    customerAddress: string,
    productId: string,
    status: SubscriptionStatus | null,
    periodDuration: number | null,
    periodEnd: number | null
  ): Promise<Result<{ hash: string; events: Array<any>; customerWalletAddress: string }, Error>> {
    const operation = this.contract.call(
      "update",
      StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "string" }),
      StellarSDK.nativeToScVal(status, { type: "u32" }),
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
        customerWalletAddress?: string;
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
    // NOTE: the contract's `charge` function does NOT take a caller argument
    const operation = this.contract.call(
      "charge",
      StellarSDK.nativeToScVal(customer, { type: "address" }),
      StellarSDK.nativeToScVal(productId, { type: "string" })
    );

    return await this.invoke(operation);
  }

  private async invoke(
    operation: StellarSDK.xdr.Operation,
    options: { readOnly?: boolean } = {}
  ): Promise<Result<{ hash: string; events: Array<any>; customerWalletAddress: string }, Error>> {
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
        console.dir({ simulation }, { depth: 1000 });
        return null as any;
        // return Result.ok(simulation.transactionData.getReadOnly()[0] as any);
      }

      // 3. Assemble & Sign (Adds footprint/resources from simulation)
      tx = StellarSDK.rpc.assembleTransaction(tx, simulation).build();
      tx.sign(this.sourceKeypair);

      // 4. Send to RPC
      const response = await this.server.sendTransaction(tx);
      if (response.status !== "PENDING") {
        return Result.err(new Error(`Transaction submission failed: ${response.status}`));
      }

      const pollResult = await this.pollForTransaction(response.hash);
      if (pollResult.isErr()) return pollResult;
      console.log({ pollResult });
      return Result.ok(pollResult.value);
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

        let customerWalletAddress: string | undefined = undefined;

        try {
          if (res.envelopeXdr) {
            const tx = new StellarSDK.Transaction(res.envelopeXdr, this.networkPassphrase);
            customerWalletAddress = tx.source;
          }
        } catch (e) {
          console.error("Failed to extract customer wallet address from transaction envelope", e);
        }

        return Result.ok({ hash, events: parsedEvents, customerWalletAddress });
      }

      if (res.status === "FAILED") {
        return Result.err(new Error(`Transaction failed on-chain: ${hash}`));
      }

      // Delay for 10s, expected to be resolved after 10 * 10s = 100s (1m40s)
      await new Promise((r) => setTimeout(r, 10 * 1000));
    }

    console.error(`Transaction polling timed out for hash: ${hash}`);
    return Result.err(new Error("Transaction polling timed out"));
  }
}
