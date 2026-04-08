import { AssetCode, AssetIssuer, Network } from "@/constant/schema.client";
import * as StellarSDK from "@stellar/stellar-sdk";
import { Result } from "@stellartools/core";

const getStellarConfig = (network: Network) => {
  const isTestnet = network === "testnet";
  const url = isTestnet
    ? process.env.NEXT_PUBLIC_STELLAR_HORIZON_TESTNET!
    : process.env.NEXT_PUBLIC_STELLAR_HORIZON_MAINNET!;

  return {
    passphrase: isTestnet ? StellarSDK.Networks.TESTNET : StellarSDK.Networks.PUBLIC,
    server: new StellarSDK.Horizon.Server(url),
    horizonUrl: url,
  };
};

export const getAsset = (code: string, issuer?: string) => {
  return code.toUpperCase() === "XLM" ? StellarSDK.Asset.native() : new StellarSDK.Asset(code, issuer!);
};

export const createAccount = async (network: Network) => {
  return Result.tryPromise(async () => {
    const { passphrase, server } = getStellarConfig(network);

    if (network === "testnet") {
      const keypair = StellarSDK.Keypair.random();
      await server.friendbot(keypair.publicKey()).call();
      const account = await server.loadAccount(keypair.publicKey());
      return { ...account, keypair };
    }

    const sourceSecret = process.env.KEEPER_SECRET!;
    const sourceKeypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    const account = await server.loadAccount(sourceKeypair.publicKey());

    const tx = new StellarSDK.TransactionBuilder(account, { fee: StellarSDK.BASE_FEE, networkPassphrase: passphrase })
      .addOperation(
        StellarSDK.Operation.createAccount({
          destination: sourceKeypair.publicKey(),
          startingBalance: "10", // 10 XLM
        })
      )
      .setTimeout(30)
      .build();

    tx.sign(sourceKeypair);
    await server.submitTransaction(tx);
    return { ...account, keypair: sourceKeypair };
  });
};

export const retrieveAccount = (publicKey: string, network: Network) => {
  const { server } = getStellarConfig(network);
  return Result.tryPromise(() => server.loadAccount(publicKey));
};

export const sendAssetPayment = async (
  sourceSecret: string,
  destination: string,
  assetCode: string,
  assetIssuer: string,
  amount: string,
  network: Network,
  memo?: string
) => {
  return Result.tryPromise(async () => {
    const { server, passphrase } = getStellarConfig(network);
    const keypair = StellarSDK.Keypair.fromSecret(sourceSecret);
    const account = await server.loadAccount(keypair.publicKey());

    const txBuilder = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: passphrase,
    }).addOperation(
      StellarSDK.Operation.payment({
        destination,
        asset: getAsset(assetCode, assetIssuer),
        amount,
      })
    );

    if (memo) txBuilder.addMemo(StellarSDK.Memo.text(memo));

    const tx = txBuilder.setTimeout(30).build();
    tx.sign(keypair);
    return await server.submitTransaction(tx);
  });
};

export const verifyPaymentByPagingToken = async (
  merchantAddress: string,
  memo: string,
  sinceToken: string,
  network: Network
) => {
  return Result.tryPromise(async () => {
    const { server } = getStellarConfig(network);
    const response = await server.transactions().forAccount(merchantAddress).cursor(sinceToken).order("asc").call();

    const match = response.records.find((tx) => tx.memo === memo);
    if (!match) return null;

    const ops = await server.payments().forTransaction(match.hash).call();
    const paymentOp = ops.records.find(
      (op): op is StellarSDK.Horizon.ServerApi.PaymentOperationRecord => op.type === "payment"
    );

    return paymentOp
      ? { hash: match.hash, amount: paymentOp.amount, successful: match.successful, from: paymentOp.from }
      : null;
  });
};

export const createTrustlines = async (
  publicKey: string,
  assets: { code: string; issuer: string }[],
  network: Network
) => {
  return Result.tryPromise(async () => {
    const { server, passphrase } = getStellarConfig(network);
    const account = await server.loadAccount(publicKey);

    const builder = new StellarSDK.TransactionBuilder(account, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: passphrase,
    });

    assets.forEach(({ code, issuer }) => {
      builder.addOperation(StellarSDK.Operation.changeTrust({ asset: getAsset(code, issuer) }));
    });

    const tx = builder.setTimeout(30).build();
    return await server.submitTransaction(tx);
  });
};

export const requiresTrustline = async (
  publicKey: string,
  assetCode: string,
  assetIssuer: string,
  network: Network
) => {
  const accountRes = await retrieveAccount(publicKey, network);
  if (accountRes.isErr()) return false;

  const targetAsset = getAsset(assetCode, assetIssuer);

  return accountRes.value.balances.some((bal) => {
    if (bal.asset_type === "native") return targetAsset.isNative();
    //@ts-ignore
    return bal.asset_code === assetCode && bal.asset_issuer === assetIssuer;
  });
};

export const getLatestPagingToken = async (publicKey: string, network: Network): Promise<string | null> => {
  const { server } = getStellarConfig(network);
  return await server
    .transactions()
    .forAccount(publicKey)
    .order("desc")
    .limit(1)
    .call()
    .then((txs) => txs.records[0]?.paging_token ?? null)
    .catch(() => null);
};

export const retrieveAssetContractId = async (assetCode: AssetCode, assetIssuer: AssetIssuer, network: Network) => {
  const { passphrase } = getStellarConfig(network);
  return getAsset(assetCode, assetIssuer).contractId(passphrase);
};

export const isValidPublicKey = (publicKey?: string): Result<boolean, Error> => {
  if (!publicKey?.trim()) return Result.err(new Error("Public key is required"));
  if (!StellarSDK.StrKey.isValidEd25519PublicKey(publicKey)) return Result.err(new Error("Invalid public key"));
  return Result.ok(true);
};

export const retrieveTransaction = async (transactionHash: string, network: Network) => {
  const { server } = getStellarConfig(network);

  return Result.tryPromise(async () => {
    const tx = await server.transactions().transaction(transactionHash).call();
    return tx;
  });
};

// -- RESPONSE PARSING --

export class ContractError extends Error {
  /**
   * The type of the error
   */
  public type: ContractErrorType;

  constructor(type: ContractErrorType) {
    super();
    this.type = type;
  }
}

export enum ContractErrorType {
  UnknownError = -1000,

  // Transaction Submission Errors
  txSorobanInvalid = -24,
  txMalformed = -23,
  txBadMinSeqAgeOrGap = -22,
  txBadSponsorship = -21,
  txFeeBumpInnerFailed = -20,
  txNotSupported = -19,
  txInternalError = -18,
  txBadAuthExtra = -17,
  txInsufficientFee = -16,
  txNoAccount = -15,
  txInsufficientBalance = -14,
  txBadAuth = -13,
  txBadSeq = -12,
  txMissingOperation = -11,
  txTooLate = -10,
  txTooEarly = -9,

  // Host Function Errors
  InvokeHostFunctionInsufficientRefundableFee = -5,
  InvokeHostFunctionEntryArchived = -4,
  InvokeHostFunctionResourceLimitExceeded = -3,
  InvokeHostFunctionTrapped = -2,
  InvokeHostFunctionMalformed = -1,

  // Common Errors
  InternalError = 1,
  OperationNotSupportedError = 2,
  AlreadyInitializedError = 3,

  UnauthorizedError = 4,
  AuthenticationError = 5,
  AccountMissingError = 6,
  AccountIsNotClassic = 7,

  NegativeAmountError = 8,
  AllowanceError = 9,
  BalanceError = 10,
  BalanceDeauthorizedError = 11,
  OverflowError = 12,
  TrustlineMissingError = 13,

  // Backstop
  BackstopBadRequest = 1000,
  NotExpired = 1001,
  InvalidRewardZoneEntry = 1002,
  InsufficientFunds = 1003,
  NotPool = 1004,
  InvalidShareMintAmount = 1005,
  InvalidTokenWithdrawAmount = 1006,
  TooManyQ4WEntries = 1007,
  NotInRewardZone = 1008,
  RewardZoneFull = 1009,
  MaxBackfillEmissions = 1010,
  BadDebtExists = 1011,

  // Pool Request Errors (start at 1200)
  PoolBadRequest = 1200,
  InvalidPoolInitArgs = 1201,
  InvalidReserveMetadata = 1202,
  InitNotUnlocked = 1203,
  StatusNotAllowed = 1204,

  // Pool State Errors
  InvalidHf = 1205,
  InvalidPoolStatus = 1206,
  InvalidUtilRate = 1207,
  MaxPositionsExceeded = 1208,
  InternalReserveNotFound = 1209,
  InvalidBTokenMintAmount = 1216,
  InvalidBTokenBurnAmount = 1217,
  InvalidDTokenMintAmount = 1218,
  InvalidDTokenBurnAmount = 1219,
  ExceededSupplyCap = 1220,
  ReserveDisabled = 1223,
  MinCollateralNotMet = 1224,

  // Oracle Errors
  StalePrice = 1210,

  // Auction Errors
  InvalidLiquidation = 1211,
  AuctionInProgress = 1212,
  InvalidLiqTooLarge = 1213,
  InvalidLiqTooSmall = 1214,
  InterestTooSmall = 1215,
  InvalidBid = 1221,
  InvalidLot = 1222,

  // Pool Factory
  InvalidPoolFactoryInitArgs = 1300,
}

export function parseError(
  errorResponse:
    | StellarSDK.rpc.Api.GetFailedTransactionResponse
    | StellarSDK.rpc.Api.SendTransactionResponse
    | StellarSDK.rpc.Api.SimulateTransactionErrorResponse
): ContractError {
  // Simulation Error
  if ("id" in errorResponse) {
    const match = errorResponse.error.match(/Error\(Contract, #(\d+)\)/);
    if (match) {
      const errorValue = parseInt(match[1], 10);
      if (errorValue in ContractErrorType) return new ContractError(errorValue as ContractErrorType);
    }
    return new ContractError(ContractErrorType.UnknownError);
  }

  // Send Transaction Error
  if ("errorResult" in errorResponse) {
    const txErrorName = errorResponse?.errorResult?.result().switch().name;
    if (txErrorName == "txFailed") {
      // Transaction should only contain one operation
      if (errorResponse?.errorResult?.result().results().length == 1) {
        const hostFunctionError = errorResponse?.errorResult
          .result()
          .results()[0]
          .tr()
          .invokeHostFunctionResult()
          .switch().value;
        if (hostFunctionError in ContractErrorType) return new ContractError(hostFunctionError as ContractErrorType);
      }
    } else {
      if (!errorResponse?.errorResult) return new ContractError(ContractErrorType.UnknownError);
      const txErrorValue = errorResponse!.errorResult.result().switch().value - 7;
      if (txErrorValue in ContractErrorType) {
        return new ContractError(txErrorValue as ContractErrorType);
      }
    }
  }

  // Get Transaction Error
  if ("resultXdr" in errorResponse) {
    // Transaction submission failed
    const txResult = errorResponse.resultXdr.result();
    const txErrorName = txResult.switch().name;

    // Use invokeHostFunctionErrors in case of generic `txFailed` error
    if (txErrorName == "txFailed") {
      // Transaction should only contain one operation
      if (errorResponse.resultXdr.result().results().length == 1) {
        const hostFunctionError = txResult.results()[0].tr().invokeHostFunctionResult().switch().value;
        if (hostFunctionError in ContractErrorType) return new ContractError(hostFunctionError as ContractErrorType);
      }
    }

    // Shift the error value to avoid collision with invokeHostFunctionErrors
    const txErrorValue = txResult.switch().value - 7;
    // Use TransactionResultCode with more specific errors
    if (txErrorValue in ContractErrorType) {
      return new ContractError(txErrorValue as ContractErrorType);
    }
  }

  // If the error is not recognized, return an unknown error
  return new ContractError(ContractErrorType.UnknownError);
}
