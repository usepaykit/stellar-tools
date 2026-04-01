import { AssetCode, AssetIssuer, Network } from "@/constant/schema.client";
import * as StellarSDK from "@stellar/stellar-sdk";
import { Result } from "@stellartools/core";

function stellarOpErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    op_no_trust: "Destination account has no trustline for this asset. Add a trustline first.",
    op_src_no_trust: "Your account has no trustline for this asset.",
    op_underfunded: "Insufficient balance to complete the payment.",
    op_no_destination: "Destination account does not exist on the network.",
    op_not_authorized: "Your account is not authorized to send this asset.",
    op_line_full: "Destination account's trustline is full.",
    op_no_issuer: "The asset issuer account does not exist.",
    op_malformed: "Payment operation is malformed.",
  };
  return messages[code] ?? `Payment failed: ${code}`;
}

export class StellarCoreApi {
  constructor(private network: Network) {}

  private getServerAndNetwork() {
    if (this.network == "testnet") {
      return {
        networkPassphrase: StellarSDK.Networks.TESTNET,
        server: new StellarSDK.Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_TESTNET!),
        horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_TESTNET!,
      };
    } else {
      return {
        networkPassphrase: StellarSDK.Networks.PUBLIC,
        server: new StellarSDK.Horizon.Server(process.env.NEXT_PUBLIC_STELLAR_HORIZON_MAINNET!),
        horizonUrl: process.env.NEXT_PUBLIC_STELLAR_HORIZON_MAINNET!,
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
      const signedTx = StellarSDK.TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase);
      const result = await server.submitTransaction(signedTx);
      return Result.ok(result);
    } catch (error: any) {
      const codes = error?.response?.data?.extras?.result_codes;
      if (codes) {
        const opCode = Array.isArray(codes.operations) ? codes.operations[0] : null;
        const txCode = codes.transaction;
        const msg = opCode
          ? stellarOpErrorMessage(opCode)
          : txCode
            ? `Transaction failed: ${txCode}`
            : "Transaction failed";
        return Result.err(new Error(msg));
      }
      return Result.err(error instanceof Error ? error : new Error("Unknown error"));
    }
  }

  isValidPublicKey(publicKey?: string): Result<boolean, Error> {
    if (!publicKey?.trim() || !publicKey) return Result.err(new Error("Public key is required"));
    if (!StellarSDK.StrKey.isValidEd25519PublicKey(publicKey)) return Result.err(new Error("Invalid public key"));
    return Result.ok(true);
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

      const transaction = txBuilder.setTimeout(params.timeout || 300).build();
      const xdr = transaction.toXDR();

      return Result.ok(xdr);
    } catch (error) {
      console.error(error);
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
      console.error(error);
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
      console.error(error);
      if (error instanceof Error) {
        return Result.err(error);
      } else return Result.err(new Error("Unknown error"));
    }
  };

  makeCheckoutURI = (params: { id: string; apiUrl: string }): string => {
    const domain = new URL(params.apiUrl).hostname;
    const initiateUrl = `${params.apiUrl}/api/checkout/${params.id}/initiate`;
    const testnetPassphrase = "Test SDF Network ; September 2015";

    // 1. Manually construct the base string.
    // We use fixed encoding to ensure the wallet sees exactly what we signed.
    let baseParams = `url=${encodeURIComponent(initiateUrl)}`;
    baseParams += `&origin_domain=${encodeURIComponent(domain)}`;

    if (this.network === "testnet") {
      baseParams += `&network_passphrase=${encodeURIComponent(testnetPassphrase)}`;
    }

    baseParams += `&msg=${encodeURIComponent("Secure Checkout with StellarTools")}`;

    const baseUri = `web+stellar:tx?${baseParams}`;

    const signature = this.signURI(baseUri);

    // 4. Final URI (Append signature as the last param)
    return `${baseUri}&signature=${encodeURIComponent(signature)}`;
  };

  signURI = (baseUri: string): string => {
    const signer = StellarSDK.Keypair.fromSecret(process.env.KEEPER_SECRET!);

    const prefix = Buffer.alloc(36);
    prefix[35] = 4;

    const SEP7_ID = "stellar.sep.7 - URI Scheme";
    const payload = Buffer.concat([prefix, Buffer.from(SEP7_ID + baseUri)]);

    return signer.sign(payload).toString("base64");
  };

  buildPaymentXDR = async (params: {
    customerAddress: string;
    merchantAddress: string;
    amount: string | number;
    assetCode?: string | null;
    assetIssuer?: string | null;
    memo: string;
    network: Network;
    subscriptionData?: {
      contractId: string;
      productId: string;
      currentPeriodEnd: Date;
    };
    checkoutExpiresAt: Date;
  }): Promise<Result<string, Error>> => {
    try {
      const { networkPassphrase, server } = this.getServerAndNetwork();
      const { customerAddress, merchantAddress, amount, assetCode, subscriptionData, assetIssuer } = params;

      const sourceAccount = await server.loadAccount(customerAddress);

      const asset =
        !assetCode || assetCode.toUpperCase() === "XLM"
          ? StellarSDK.Asset.native()
          : new StellarSDK.Asset(assetCode, assetIssuer!);

      let tx = new StellarSDK.TransactionBuilder(sourceAccount, {
        fee: "10000",
        networkPassphrase,
      })
        .addOperation(
          StellarSDK.Operation.payment({ destination: merchantAddress.trim(), asset, amount: String(amount) })
        )
        .addMemo(StellarSDK.Memo.text(params.memo));

      if (subscriptionData) {
        const amountBigInt = BigInt(Math.round(Number(params.amount) * 1e7));
        // tokenContractId = the asset's Stellar Asset Contract (SAC)
        const tokenContractId = await this.retrieveAssetContractId(params.assetCode!, params.assetIssuer!);
        // engineContractId = the subscription engine contract (the spender for approve)
        const engineContractId = subscriptionData.contractId;

        const tokenContract = new StellarSDK.Contract(tokenContractId);
        const engineContract = new StellarSDK.Contract(engineContractId);

        // Duration in seconds = time from now until currentPeriodEnd
        const durationSeconds = BigInt(
          Math.max(0, Math.floor((subscriptionData.currentPeriodEnd.getTime() - Date.now()) / 1000))
        );

        tx.addOperation(
          tokenContract.call(
            "approve",
            StellarSDK.nativeToScVal(params.customerAddress, { type: "address" }), // from
            StellarSDK.nativeToScVal(engineContractId, { type: "address" }), // spender = engine contract
            StellarSDK.nativeToScVal(amountBigInt * BigInt(120), { type: "i128" }), // 120 periods of allowance
            StellarSDK.nativeToScVal(9999999, { type: "u32" }) // expiration ledger
          )
        ).addOperation(
          engineContract.call(
            "start",
            StellarSDK.nativeToScVal(params.customerAddress, { type: "address" }),
            StellarSDK.nativeToScVal(params.merchantAddress, { type: "address" }),
            StellarSDK.nativeToScVal(tokenContractId, { type: "address" }),
            StellarSDK.nativeToScVal(subscriptionData.productId.slice(-32), { type: "symbol" }), // Soroban symbol is capped at 32 chars
            StellarSDK.nativeToScVal(amountBigInt, { type: "i128" }),
            StellarSDK.nativeToScVal(durationSeconds, { type: "u64" }), // duration in seconds
            StellarSDK.nativeToScVal(params.customerAddress, { type: "address" }) // caller = customer
          )
        );
      }

      const transaction = tx.setTimeout(Math.floor(params.checkoutExpiresAt.getTime() / 1000)).build();

      return Result.ok(transaction.toEnvelope().toXDR().toString("base64"));
    } catch (error: any) {
      return Result.err(error);
    }
  };

  retrieveAssetContractId = async (assetCode: AssetCode, assetIssuer?: AssetIssuer) => {
    const { networkPassphrase } = this.getServerAndNetwork();

    const asset =
      assetCode.toUpperCase() === "XLM" && (!assetIssuer || assetIssuer === "native")
        ? StellarSDK.Asset.native()
        : new StellarSDK.Asset(assetCode, assetIssuer!);

    return asset.contractId(networkPassphrase);
  };

  getNetworkPassphrase = (network: Network) => {
    return network === "testnet" ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC;
  };

  verifyPaymentByPagingToken = async (
    merchantAddress: string,
    memo: string,
    sinceToken: string
  ): Promise<Result<{ hash: string; amount: string; successful: boolean; from: string } | null, Error>> => {
    try {
      const { server } = this.getServerAndNetwork();

      const response = await server.transactions().forAccount(merchantAddress).cursor(sinceToken).order("asc").call();

      const match = response.records.find((tx) => tx.memo === memo);

      if (match) {
        const ops = await server.payments().forTransaction(match.hash).call();
        const paymentOp = ops.records.find(
          (op): op is StellarSDK.Horizon.ServerApi.PaymentOperationRecord => op.type === "payment"
        );

        if (paymentOp) {
          return Result.ok({
            hash: match.hash,
            amount: paymentOp.amount,
            successful: match.successful,
            from: paymentOp.from,
          });
        }
      }

      return Result.ok(null);
    } catch (e: any) {
      return Result.err(e instanceof Error ? e : new Error(String(e)));
    }
  };

  getLatestPagingToken = async (publicKey: string) => {
    const { server } = this.getServerAndNetwork();
    return await Result.tryPromise(async () => {
      const txs = await server.transactions().forAccount(publicKey).order("desc").limit(1).call();
      return txs.records[0]?.paging_token || "now";
    }).catch(() => Result.ok("now"));
  };

  addTrustline = async (
    secretKey: string,
    assetCode: string,
    assetIssuer: string
  ): Promise<Result<StellarSDK.Horizon.HorizonApi.SubmitTransactionResponse | null, Error>> => {
    try {
      const { server, networkPassphrase } = this.getServerAndNetwork();
      const keypair = StellarSDK.Keypair.fromSecret(secretKey);
      const account = await server.loadAccount(keypair.publicKey());
      const asset = new StellarSDK.Asset(assetCode, assetIssuer);
      const tx = new StellarSDK.TransactionBuilder(account, { fee: StellarSDK.BASE_FEE, networkPassphrase })
        .addOperation(StellarSDK.Operation.changeTrust({ asset }))
        .setTimeout(30)
        .build();
      tx.sign(keypair);
      const result = await server.submitTransaction(tx);
      return Result.ok(result);
    } catch (error: any) {
      const codes = error?.response?.data?.extras?.result_codes;
      if (codes) return Result.err(new Error(JSON.stringify(codes)));
      return Result.err(error instanceof Error ? error : new Error("Failed to add trustline"));
    }
  };

  checkTrustline = async (
    publicKey: string,
    assetCode: string,
    assetIssuer: string
  ): Promise<Result<boolean, Error>> => {
    const { horizonUrl } = this.getServerAndNetwork();

    try {
      const res = await fetch(`${horizonUrl}/accounts/${publicKey}`);
      if (!res.ok) return Result.err(new Error("Account not found"));
      const account = await res.json();
      const hasTrustline: boolean = account.balances?.some(
        (b: any) => b.asset_type !== "native" && b.asset_code === assetCode && b.asset_issuer === assetIssuer
      );
      return Result.ok(hasTrustline);
    } catch (error) {
      return Result.err(error instanceof Error ? error : new Error("Failed to check trustline"));
    }
  };
}
