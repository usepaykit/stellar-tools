import { Network } from "@/db";
import * as StellarSDK from "@stellar/stellar-sdk";
import { Contract, SorobanRpc } from "@stellar/stellar-sdk";

export class SubscriptionContractClient {
  private contract: Contract;
  private server: SorobanRpc.Server; // ← Soroban RPC (not Horizon!)
  private sourceKeypair: StellarSDK.Keypair;

  constructor(network: Network, contractId: string, sourceSecret: string) {
    // Soroban RPC endpoint (different from Horizon)
    this.server = new SorobanRpc.Server(
      network === "testnet"
        ? "https://soroban-testnet.stellar.org" // ← Soroban RPC
        : "https://soroban-mainnet.stellar.org"
    );

    this.sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    this.contract = new Contract(contractId); // ← Contract ID from deployment
  }

  /**
   * Call contract function
   */
  async createSubscription(params: {
    customer: string;
    productId: string;
    periodStart: number;
    periodEnd: number;
    amount: bigint;
  }): Promise<string> {
    // Step 1: Build contract call
    const operation = this.contract.call(
      "create_subscription", // Function name
      StellarSDK.nativeToScVal(params.customer, { type: "address" }),
      StellarSDK.nativeToScVal(params.productId, { type: "symbol" }),
      StellarSDK.nativeToScVal(params.periodStart, { type: "u64" }),
      StellarSDK.nativeToScVal(params.periodEnd, { type: "u64" }),
      StellarSDK.nativeToScVal(params.amount, { type: "i128" })
    );

    // Step 2: Get source account
    const sourceAccount = await this.server.getAccount(this.sourceKeypair.publicKey());

    // Step 3: Build transaction
    const transaction = new StellarSDK.TransactionBuilder(sourceAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: this.network === "testnet" ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC,
    })
      .addOperation(operation)
      .setTimeout(30)
      .build();

    // Step 4: Sign transaction
    transaction.sign(this.sourceKeypair);

    // Step 5: Simulate (check for errors before sending)
    const simulation = await this.server.simulateTransaction(transaction);

    if (SorobanRpc.Api.isSimulationError(simulation)) {
      throw new Error(`Contract simulation failed: ${simulation.error}`);
    }

    // Step 6: Send transaction
    const sendResult = await this.server.sendTransaction(transaction);

    if (sendResult.status === SorobanRpc.Api.SendTransactionStatus.ERROR) {
      throw new Error(`Transaction failed: ${sendResult.errorResult}`);
    }

    // Step 7: Wait for confirmation
    const getTransactionResult = await this.server.getTransaction(sendResult.hash);

    if (getTransactionResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
      // Extract return value
      const result = StellarSDK.scValToNative(getTransactionResult.result?.retval);
      return result as string;
    }

    throw new Error("Transaction did not succeed");
  }
}
