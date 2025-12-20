import { ApiResponse } from "@/types";
import * as StellarSDK from "@stellar/stellar-sdk";

export class Stellar {
  constructor(
    private server: StellarSDK.Horizon.Server,
    private networkPassphrase: StellarSDK.Networks
  ) {}

  async createAccount(
    sourceSecret: string,
    destinationPublicKey: string,
    startingBalance: string
  ): Promise<ApiResponse<StellarSDK.Horizon.AccountResponse | null>> {
    if (this.networkPassphrase == StellarSDK.Networks.TESTNET) {
      const keypair = StellarSDK.Keypair.random();

      await fetch(`https://friendbot.stellar.org/?addr=${keypair.publicKey()}`);

      const account = await this.server.loadAccount(keypair.publicKey());

      return { data: account, error: undefined };
    }

    const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    const account = await this.server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        StellarSDK.Operation.createAccount({
          destination: destinationPublicKey,
          startingBalance,
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);

    await this.server.submitTransaction(transaction);

    return { data: account };
  }

  async fundAccount(
    sourceSecret: string,
    destinationPublicKey: string,
    startingBalance: string
  ): Promise<
    ApiResponse<
      StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null,
      string
    >
  > {
    try {
      const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);

      const account = await this.server.loadAccount(sourceKeypair.publicKey());

      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          StellarSDK.Operation.createAccount({
            destination: destinationPublicKey,
            startingBalance,
          })
        )
        .setTimeout(30)
        .build();

      transaction.sign(sourceKeypair);
      const result = await this.server.submitTransaction(transaction);

      return { data: result };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  retrieveAccount = async (
    publicKey: string
  ): Promise<ApiResponse<StellarSDK.Horizon.AccountResponse | null>> => {
    const account = await this.server.loadAccount(publicKey);
    return { data: account, error: undefined };
  };

  retrieveTxHistory = async (
    accountId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<
    ApiResponse<StellarSDK.Horizon.ServerApi.CollectionPage<StellarSDK.Horizon.ServerApi.TransactionRecord> | null>
  > => {
    const query = this.server.transactions().forAccount(accountId);

    if (cursor) {
      query.cursor(cursor);
    }

    if (limit) {
      query.limit(limit);
    }

    query.order("desc");

    const transactions = await query.call();

    return { data: transactions };
  };

  retrievePaymentHistory = async (
    accountId: string,
    limit: number = 20,
    cursor?: string
  ) => {
    const query = this.server.payments().forAccount(accountId);

    if (cursor) {
      query.cursor(cursor);
    }

    if (limit) {
      query.limit(limit);
    }

    query.order("desc");

    const payments = await query.call();

    return { data: payments };
  };

  sendAssetPayment = async (
    sourceSecret: string,
    destinationPublicKey: string,
    assetCode: string,
    assetIssuer: string,
    amount: string,
    memo?: string
  ): Promise<ApiResponse<unknown, string>> => {
    try {
      const keypair = StellarSDK.Keypair.fromSecret(sourceSecret);
      const account = await this.server.loadAccount(keypair.publicKey());

      const asset =
        assetCode === "XLM"
          ? StellarSDK.Asset.native()
          : new StellarSDK.Asset(assetCode, assetIssuer);

      const txBuilder = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      }).addOperation(
        StellarSDK.Operation.payment({
          destination: destinationPublicKey,
          asset,
          amount,
        })
      );

      if (memo) {
        txBuilder.addMemo(StellarSDK.Memo.text(memo));
      }

      const transaction = txBuilder.setTimeout(30).build();
      transaction.sign(keypair);
      const result = await this.server.submitTransaction(transaction);

      return { data: result };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}
