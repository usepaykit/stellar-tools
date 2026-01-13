import { Network } from "@/db";
import { ApiResponse } from "@/types";
import * as StellarSDK from "@stellar/stellar-sdk";
import { Sep7Pay, Sep7Tx } from "@stellar/typescript-wallet-sdk";

export class Stellar {
  constructor(private network: Network) {}

  private getServerAndNetwork() {
    if (this.network == "testnet") {
      return {
        networkPassphrase: StellarSDK.Networks.TESTNET,
        server: new StellarSDK.Horizon.Server(process.env.STELLAR_TESTNET_HORIZON_URL!),
      };
    } else {
      return {
        networkPassphrase: StellarSDK.Networks.PUBLIC,
        server: new StellarSDK.Horizon.Server(process.env.STELLAR_MAINNET_HORIZON_URL!),
      };
    }
  }

  async createAccount(
    sourceSecret: string,
    destinationPublicKey: string,
    startingBalance: string
  ): Promise<ApiResponse<StellarSDK.Horizon.AccountResponse | null>> {
    const { networkPassphrase, server } = this.getServerAndNetwork();

    if (networkPassphrase == StellarSDK.Networks.TESTNET) {
      const keypair = StellarSDK.Keypair.random();

      server.friendbot(keypair.publicKey());

      const account = await server.loadAccount(keypair.publicKey());

      return { data: account, error: undefined };
    }

    const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase,
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

    await server.submitTransaction(transaction);

    return { data: account };
  }

  async fundAccount(
    sourceSecret: string,
    destinationPublicKey: string,
    startingBalance: string
  ): Promise<ApiResponse<StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null, string>> {
    if (!StellarSDK.StrKey.isValidEd25519PublicKey(destinationPublicKey)) {
      return {
        data: null,
        error: "Invalid destination public key",
      };
    }

    try {
      const { networkPassphrase, server } = this.getServerAndNetwork();
      const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);

      const account = await server.loadAccount(sourceKeypair.publicKey());

      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
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
      const result = await server.submitTransaction(transaction);

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
    const { server } = this.getServerAndNetwork();
    const account = await server.loadAccount(publicKey);
    return { data: account, error: undefined };
  };

  retrieveTxHistory = async (
    accountId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<
    ApiResponse<StellarSDK.Horizon.ServerApi.CollectionPage<StellarSDK.Horizon.ServerApi.TransactionRecord> | null>
  > => {
    const { server } = this.getServerAndNetwork();
    const query = server.transactions().forAccount(accountId);

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

  retrievePaymentHistory = async (accountId: string, limit: number = 20, cursor?: string) => {
    const { server } = this.getServerAndNetwork();
    const query = server.payments().forAccount(accountId);

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

  retrieveTx = async (
    transactionHash: string
  ): Promise<ApiResponse<StellarSDK.Horizon.ServerApi.TransactionRecord | null>> => {
    const { server } = this.getServerAndNetwork();

    const transaction = await server.transactions().transaction(transactionHash).call();

    return { data: transaction };
  };

  retrievePayment = async (transactionHash: string) => {
    const { server } = this.getServerAndNetwork();

    const payment = await server.payments().forTransaction(transactionHash).call();

    return { data: payment };
  };

  sendAssetPayment = async (
    sourceSecret: string,
    destinationPublicKey: string,
    assetCode: string,
    assetIssuer: string,
    amount: string,
    memo?: string
  ): Promise<
    ApiResponse<StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null, string>
  > => {
    try {
      const keypair = StellarSDK.Keypair.fromSecret(sourceSecret);

      const { server, networkPassphrase } = this.getServerAndNetwork();

      const account = await server.loadAccount(keypair.publicKey());

      const asset =
        assetCode === "XLM"
          ? StellarSDK.Asset.native()
          : new StellarSDK.Asset(assetCode, assetIssuer);

      const txBuilder = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
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
      const result = await server.submitTransaction(transaction);

      return { data: result };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  streamTx = (
    publicKey: string,
    evts: {
      onError: (event: MessageEvent) => void;
      onMessage: (event: StellarSDK.Horizon.ServerApi.TransactionRecord) => void;
    }
  ): (() => void) => {
    const { server } = this.getServerAndNetwork();

    return server
      .transactions()
      .forAccount(publicKey)
      .cursor("now")
      .stream({ onerror: evts.onError, onmessage: evts.onMessage });
  };

  /**
   * Creates a SEP-7 payment URI for wallet-based payments using the native Sep7Pay class
   * @param params Payment URI parameters
   * @returns A web+stellar:pay URI that can be scanned or clicked
   * @see https://developers.stellar.org/docs/build/apps/wallet/sep7
   */
  makePaymentURI = (params: {
    destination: string;
    amount?: string;
    assetCode?: string;
    assetIssuer?: string;
    memo?: string;
    message?: string;
    callback?: string;
    originDomain?: string;
  }): string => {
    const { destination, amount, assetCode, assetIssuer, memo, message, callback, originDomain } =
      params;

    const paymentRequest = Sep7Pay.forDestination(destination);

    if (amount) paymentRequest.amount = amount;

    if (assetCode && assetCode !== "XLM") {
      paymentRequest.assetCode = assetCode;
      if (assetIssuer) paymentRequest.assetIssuer = assetIssuer;
    }
    if (memo) paymentRequest.memo = memo;

    if (message) paymentRequest.msg = message;
    if (callback) paymentRequest.callback = callback;

    if (originDomain) paymentRequest.originDomain = originDomain;

    return paymentRequest.toString();
  };

  /**
   * Creates a SEP-7 transaction URI for signing pre-built transactions using the native Sep7Tx class
   * @param params Transaction URI parameters
   * @returns A web+stellar:tx URI that can be scanned or clicked
   * @see https://developers.stellar.org/docs/build/apps/wallet/sep7
   */
  makeTransactionURI = (params: {
    transaction: StellarSDK.Transaction;
    callback?: string;
    message?: string;
    originDomain?: string;
  }): string => {
    const { transaction, callback, message, originDomain } = params;

    const txRequest = Sep7Tx.forTransaction(transaction as any);
    if (callback) txRequest.callback = callback;

    if (message) txRequest.msg = message;
    if (originDomain) txRequest.originDomain = originDomain;

    return txRequest.toString();
  };
}
