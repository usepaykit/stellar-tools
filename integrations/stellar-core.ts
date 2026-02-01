import { ProductType } from "@/constant/schema.client";
import { Network } from "@/db";
import * as StellarSDK from "@stellar/stellar-sdk";
import { Result } from "@stellartools/core";

export class StellarCoreApi {
  constructor(private network: Network) {}

  private getServerAndNetwork() {
    if (this.network == "testnet") {
      return {
        networkPassphrase: StellarSDK.Networks.TESTNET,
        server: new StellarSDK.Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_TESTNET!),
      };
    } else {
      return {
        networkPassphrase: StellarSDK.Networks.PUBLIC,
        server: new StellarSDK.Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_MAINNET!),
      };
    }
  }

  async createAccount(): Promise<
    Result<(StellarSDK.Horizon.AccountResponse & { keypair: StellarSDK.Keypair }) | null, Error>
  > {
    const sourceSecret = process.env.KEEPER_SECRET!;
    const startingBalance = 1 * 1e7;

    const { networkPassphrase, server } = this.getServerAndNetwork();

    if (networkPassphrase == StellarSDK.Networks.TESTNET) {
      const keypair = StellarSDK.Keypair.random();

      await server.friendbot(keypair.publicKey()).call();

      const account = await server.loadAccount(keypair.publicKey());

      const result = { ...account, keypair } as unknown as StellarSDK.Horizon.AccountResponse & {
        keypair: StellarSDK.Keypair;
      };

      return Result.ok(result);
    }

    const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const transaction = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSDK.Operation.createAccount({
          destination: sourceKeypair.publicKey(),
          startingBalance: startingBalance.toString(),
        })
      )
      .setTimeout(30)
      .build();

    transaction.sign(sourceKeypair);

    await server.submitTransaction(transaction);

    const result = { ...account, keypair: sourceKeypair } as unknown as StellarSDK.Horizon.AccountResponse & {
      keypair: StellarSDK.Keypair;
    };

    return Result.ok(result);
  }

  /**
   * Submits a signed transaction to the Stellar network
   * To be used after a wallet has signed the transaction
   * @param signedTxXdr Signed transaction XDR string
   * @returns Transaction submission result
   */
  async submitSignedTransaction(
    signedTxXdr: string
  ): Promise<Result<StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null, Error>> {
    try {
      const { server, networkPassphrase } = this.getServerAndNetwork();

      // Parse the signed transaction
      const signedTx = StellarSDK.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);

      // Submit to network
      const result = await server.submitTransaction(signedTx);

      return Result.ok(result);
    } catch (error) {
      if (error instanceof Error) {
        return Result.err(error);
      } else return Result.err(new Error("Unknown error"));
    }
  }

  /**
   * Builds an unsigned payment transaction for wallet signing
   * Use this when you want the user's wallet to sign the transaction
   * @param params Payment transaction parameters
   * @returns Unsigned transaction XDR string ready for wallet signing
   */
  async buildPaymentTransaction(params: {
    sourcePublicKey: string;
    destination: string;
    amount: string;
    assetCode?: string;
    assetIssuer?: string;
    memo?: string | number;
    memoType?: "text" | "id" | "hash" | "return";
    timeout?: number;
  }): Promise<Result<string | null, Error>> {
    try {
      const { server, networkPassphrase } = this.getServerAndNetwork();

      if (!StellarSDK.StrKey.isValidEd25519PublicKey(params.sourcePublicKey)) {
        return Result.err(new Error("Invalid source public key"));
      }

      if (!StellarSDK.StrKey.isValidEd25519PublicKey(params.destination)) {
        return Result.err(new Error("Invalid destination public key"));
      }

      const account = await server.loadAccount(params.sourcePublicKey);

      const asset =
        !params.assetCode || params.assetCode === "XLM"
          ? StellarSDK.Asset.native()
          : new StellarSDK.Asset(params.assetCode, params.assetIssuer!);

      const txBuilder = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE,
        networkPassphrase,
      }).addOperation(
        StellarSDK.Operation.payment({
          destination: params.destination,
          asset,
          amount: params.amount,
        })
      );

      if (params.memo) {
        const memoType = params.memoType || "text";
        switch (memoType) {
          case "text":
            txBuilder.addMemo(StellarSDK.Memo.text(params.memo as string));
            break;
          case "id":
            txBuilder.addMemo(StellarSDK.Memo.id(parseInt(params.memo as string)!.toString()));
            break;
          case "hash":
            txBuilder.addMemo(StellarSDK.Memo.hash(Buffer.from(params.memo as string)));
            break;
          case "return":
            txBuilder.addMemo(StellarSDK.Memo.return(Buffer.from(params.memo as string).toString()));
            break;
        }
      }

      const transaction = txBuilder.setTimeout(params.timeout || 30).build();
      const xdr = transaction.toXDR();

      return Result.ok(xdr);
    } catch (error) {
      if (error instanceof Error) {
        return Result.err(error);
      } else return Result.err(new Error("Unknown error"));
    }
  }

  /**
   * Complete wallet-based payment flow
   * Builds transaction, signs with wallet, and submits
   * @param params Payment parameters
   * @param signTransaction Function to sign transaction with wallet (returns signed XDR)
   * @returns Transaction submission result
   */
  async processWalletPayment(
    params: {
      sourcePublicKey: string;
      destination: string;
      amount: string;
      assetCode?: string;
      assetIssuer?: string;
      memo?: string;
      memoType?: "text" | "id" | "hash" | "return";
      timeout?: number;
    },
    signTransaction: (xdr: string) => Promise<string>
  ): Promise<Result<StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null, Error>> {
    try {
      const buildResult = await this.buildPaymentTransaction(params);

      if (buildResult.isErr()) {
        return Result.err(new Error("Failed to build transaction"));
      }

      const signedTxXdr = await signTransaction(buildResult.value!);

      return await this.submitSignedTransaction(signedTxXdr);
    } catch (error) {
      if (error instanceof Error) {
        return Result.err(error);
      } else return Result.err(new Error("Unknown error"));
    }
  }

  retrieveAccount = async (publicKey: string): Promise<Result<StellarSDK.Horizon.AccountResponse | null, Error>> => {
    const { server } = this.getServerAndNetwork();
    const account = await server.loadAccount(publicKey);
    return Result.ok(account);
  };

  retrieveTxHistory = async (
    accountId: string,
    limit: number = 20,
    cursor?: string
  ): Promise<
    Result<StellarSDK.Horizon.ServerApi.CollectionPage<StellarSDK.Horizon.ServerApi.TransactionRecord> | null, Error>
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

    return Result.ok(transactions);
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

    return Result.ok(payments);
  };

  retrieveTx = async (
    transactionHash: string
  ): Promise<Result<StellarSDK.Horizon.ServerApi.TransactionRecord | null, Error>> => {
    const { server } = this.getServerAndNetwork();

    const transaction = await server.transactions().transaction(transactionHash).call();

    return Result.ok(transaction);
  };

  retrievePayment = async (transactionHash: string) => {
    const { server } = this.getServerAndNetwork();

    const payment = await server.payments().forTransaction(transactionHash).call();

    return Result.ok(payment);
  };

  sendAssetPayment = async (
    sourceSecret: string,
    destinationPublicKey: string,
    assetCode: string,
    assetIssuer: string,
    amount: string,
    memo?: string
  ): Promise<Result<StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null, Error>> => {
    try {
      const keypair = StellarSDK.Keypair.fromSecret(sourceSecret);

      const { server, networkPassphrase } = this.getServerAndNetwork();

      const account = await server.loadAccount(keypair.publicKey());

      const asset = assetCode === "XLM" ? StellarSDK.Asset.native() : new StellarSDK.Asset(assetCode, assetIssuer);

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

      return Result.ok(result);
    } catch (error) {
      if (error instanceof Error) {
        return Result.err(error);
      } else return Result.err(new Error("Unknown error"));
    }
  };

  makeCheckoutURI = (params: {
    id: string;
    memo: string;
    type: ProductType;
    destination: string;
    amount: string;
    callback?: string;
    network: Network;
    productId: string;
    currentPeriodEnd: Date | null;
    assetCode: string | null;
    assetIssuer: string | null;
  }): string => {
    let urlParams: URLSearchParams;

    if (params.type === "subscription") {
      urlParams = new URLSearchParams({
        merchantAddress: params.destination,
        network: params.network,
        productId: params.productId,
        amount: params.amount.toString(),
        periodEnd: params.currentPeriodEnd!.toISOString(),
        assetCode: params.assetCode!,
        assetIssuer: params.assetIssuer!,
      });
      // Allows wallet to request the transaction details from the server once the user is authenticated
      const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/checkouts/${params.id}/initiate-subscription?merchantAddress=${params.destination}`;
      return `web+stellar:tx?url=${encodeURIComponent(requestUrl)}`;
    }

    urlParams = new URLSearchParams({
      destination: params.destination,
      amount: params.amount,
      memo: params.memo,
      ...(params.callback ? { callback: params.callback } : {}),
    });

    return `web+stellar:pay?${urlParams.toString()}`;
  };

  buildSubscriptionXDR = async (params: {
    customerAddress: string;
    merchantAddress: string;
    amount: number;
    tokenContractId: string;
    engineContractId: string;
    productId: string;
    network: Network;
    currentPeriodEnd: Date;
  }) => {
    const { network, customerAddress, engineContractId, tokenContractId } = params;

    const server = new StellarSDK.rpc.Server(process.env.RPC_URL!);

    const source = await server.getAccount(customerAddress);

    const tokenContract = new StellarSDK.Contract(tokenContractId);
    const engineContract = new StellarSDK.Contract(engineContractId);

    // Conversion: 20.00 -> 200,000,000 (7 decimals)
    const amountBigInt = BigInt(Math.round(params.amount * 1e7));

    const tx = new StellarSDK.TransactionBuilder(source, {
      fee: "10000",
      networkPassphrase: network === "testnet" ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC,
    })
      /**
       * OPERATION 1: Talk to the TOKEN CONTRACT (The Bank)
       * Action: "Bank, let the Subscription Engine spend 10 years worth of my money"
       */
      .addOperation(
        tokenContract.call(
          "approve",
          StellarSDK.nativeToScVal(customerAddress, { type: "address" }), // from
          StellarSDK.nativeToScVal(engineContractId, { type: "address" }), // spender
          StellarSDK.nativeToScVal(amountBigInt * BigInt(120), { type: "i128" }), // amount (10 years)
          StellarSDK.nativeToScVal(9999999, { type: "u32" }) // valid basically forever
        )
      )
      /**
       * OPERATION 2: Talk to your SUBSCRIPTION ENGINE (The Merchant)
       * Action: "Register me and take the first month's payment"
       */
      .addOperation(
        engineContract.call(
          "start",
          StellarSDK.nativeToScVal(customerAddress, { type: "address" }),
          StellarSDK.nativeToScVal(params.merchantAddress, { type: "address" }),
          StellarSDK.nativeToScVal(tokenContractId, { type: "address" }),
          StellarSDK.nativeToScVal(params.productId, { type: "symbol" }),
          StellarSDK.nativeToScVal(amountBigInt, { type: "i128" }),
          StellarSDK.nativeToScVal(Math.floor(params.currentPeriodEnd.getTime() / 1000), { type: "u64" }) // 30 days
        )
      )
      .setTimeout(0)
      .build();

    return tx.toXDR();
  };

  retrieveAssetContractId = async (assetCode: string, assetIssuer?: string) => {
    const { networkPassphrase } = this.getServerAndNetwork();

    const asset =
      assetCode.toUpperCase() === "XLM" && (!assetIssuer || assetIssuer === "native")
        ? StellarSDK.Asset.native()
        : new StellarSDK.Asset(assetCode, assetIssuer!);

    return asset.contractId(networkPassphrase);
  };
}
