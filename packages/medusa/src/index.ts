import {
  CapturePaymentInput,
  CapturePaymentOutput,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  CreateAccountHolderInput,
  CreateAccountHolderOutput,
  UpdateAccountHolderInput,
  UpdateAccountHolderOutput,
  DeleteAccountHolderInput,
  DeleteAccountHolderOutput,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import { Horizon } from "@stellar/stellar-sdk";
import type { StellarMedusaOptions, StellarPaymentData } from "./types";
import { stellarOptionsSchema } from "./types";
import { tryCatchAsync } from "./utils";

interface ResolvedConfig {
  horizonServerUrl: string;
  merchantPublicKey: string;
  networkPassphrase: string;
}

export class StellarMedusaAdapter extends AbstractPaymentProvider<StellarMedusaOptions> {
  static identifier = "stellar";

  protected horizonServer: Horizon.Server | null = null;
  protected readonly options: StellarMedusaOptions;
  private configPromise: Promise<ResolvedConfig> | null = null;
  private resolvedConfig: ResolvedConfig | null = null;

  static validateOptions(options: Record<string, unknown>): void | never {
    const { error } = stellarOptionsSchema.safeParse(options);

    if (error) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message);
    }

    return;
  }

  private async resolveConfigFromApiKey(): Promise<ResolvedConfig> {
    if (this.resolvedConfig) {
      return this.resolvedConfig;
    }

    if (!this.configPromise) {
      this.configPromise = this.fetchConfig();
    }

    return this.configPromise;
  }

  private async fetchConfig(): Promise<ResolvedConfig> {
    // TODO: Replace with actual SDK/cloud service implementation

    // fake promise to relace with actual api key to resolve the config
    await new Promise((resolve) => setTimeout(resolve, 0));

    const mockConfig: ResolvedConfig = {
      horizonServerUrl:
        process.env.STELLAR_HORIZON_URL ||
        "https://horizon-testnet.stellar.org",
      merchantPublicKey:
        process.env.STELLAR_MERCHANT_PUBLIC_KEY ||
        "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
      networkPassphrase:
        process.env.STELLAR_NETWORK_PASSPHRASE ||
        "Test SDF Network ; September 2015",
    };

    this.resolvedConfig = mockConfig;
    this.horizonServer = new Horizon.Server(mockConfig.horizonServerUrl);

    if (this.options.debug) {
      console.info(
        `[Stellar] Initialized with network: ${mockConfig.networkPassphrase}`
      );
    }

    return mockConfig;
  }

  private async ensureInitialized(): Promise<ResolvedConfig> {
    return this.resolveConfigFromApiKey();
  }

  constructor(cradle: Record<string, unknown>, options: StellarMedusaOptions) {
    super(cradle, options);
    this.options = options;
  }

  initiatePayment = async ({
    context,
    amount,
    currency_code,
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> => {
    const config = await this.ensureInitialized();

    if (this.options.debug) {
      console.info("[Stellar] Initiating payment", {
        context,
        amount,
        currency_code,
        data,
      });
    }

    const memo = crypto.randomUUID();
    const paymentId = crypto.randomUUID();

    // TODO: Cloud integration - Store payment session in database
    // TODO: Cloud integration - Create checkout session via cloud API
    // TODO: Cloud integration - Generate payment QR code via cloud service
    // TODO: Cloud integration - Set up payment monitoring webhook

    const paymentData: StellarPaymentData = {
      id: paymentId,
      memo,
      amount: amount.toString(),
      asset_code: this.options.defaultAsset?.code || "XLM",
      asset_issuer: this.options.defaultAsset?.issuer,
      status: "pending",
      created_at: Date.now(),
      expires_at: Date.now() + 600 * 1000,
      payment_url: `stellar:${config.merchantPublicKey}?amount=${amount}&memo=${memo}&asset=${currency_code}`,
    };

    return {
      id: paymentId,
      status: PaymentSessionStatus.PENDING,
      data: paymentData as unknown as Record<string, unknown>,
    };
  };

  capturePayment = async (
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> => {
    const config = await this.ensureInitialized();

    if (this.options.debug) {
      console.info("[Stellar] Capturing payment", input);
    }

    const paymentData = input.data as unknown as StellarPaymentData;

    if (!paymentData.txHash) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Transaction hash is required to capture payment"
      );
    }

    // TODO: Cloud integration - Verify payment via cloud service
    // TODO: Cloud integration - Update payment status in cloud database
    // TODO: Cloud integration - Trigger fulfillment webhooks

    if (!this.horizonServer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Horizon server not initialized"
      );
    }

    const [tx, txError] = await tryCatchAsync(
      this.horizonServer.transactions().transaction(paymentData.txHash).call()
    );

    if (txError) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Failed to retrieve transaction from Horizon"
      );
    }

    if (tx.memo !== paymentData.memo) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Transaction memo does not match"
      );
    }

    const operations = await tx.operations();
    const paymentOp = operations.records.find(
      (op: Horizon.ServerApi.OperationRecord) =>
        op.type === "payment" && op.to === config.merchantPublicKey
    );

    if (!paymentOp) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Payment operation not found in transaction"
      );
    }

    paymentData.status = "succeeded";
    paymentData.txHash = tx.hash;

    return {
      data: paymentData as unknown as Record<string, unknown>,
    };
  };

  authorizePayment = async (
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Authorizing payment", input);
    }

    // TODO: Cloud integration - Check payment status via cloud API
    // TODO: Cloud integration - Verify transaction on blockchain via cloud service

    return this.getPaymentStatus(input);
  };

  cancelPayment = async (
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Canceling payment", input);
    }

    const paymentData = input.data as unknown as StellarPaymentData;

    // TODO: Cloud integration - Cancel payment session in cloud database
    // TODO: Cloud integration - Send cancellation webhooks

    paymentData.status = "canceled";

    return {
      data: paymentData as unknown as Record<string, unknown>,
    };
  };

  deletePayment = async (
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Deleting payment", input);
    }

    // TODO: Cloud integration - Delete payment from cloud database

    return this.cancelPayment(input);
  };

  getPaymentStatus = async (
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Getting payment status", input);
    }

    const paymentData = input.data as unknown as StellarPaymentData;

    // TODO: Cloud integration - Fetch payment status from cloud database
    // TODO: Cloud integration - Check for pending transactions via cloud monitoring

    const statusMap: Record<
      StellarPaymentData["status"],
      PaymentSessionStatus
    > = {
      pending: PaymentSessionStatus.PENDING,
      processing: PaymentSessionStatus.PENDING,
      succeeded: PaymentSessionStatus.AUTHORIZED,
      failed: PaymentSessionStatus.ERROR,
      canceled: PaymentSessionStatus.CANCELED,
    };

    return {
      status: statusMap[paymentData.status] || PaymentSessionStatus.PENDING,
      data: paymentData as unknown as Record<string, unknown>,
    };
  };

  refundPayment = async (
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Refunding payment", input);
    }

    // TODO: Cloud integration - Create refund transaction via cloud service
    // TODO: Cloud integration - Sign and submit refund to Stellar network
    // TODO: Cloud integration - Store refund record in cloud database
    // TODO: Cloud integration - Send refund confirmation webhooks

    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Refunds are not yet supported for Stellar payments."
    );
  };

  retrievePayment = async (
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Retrieving payment", input);
    }

    // TODO: Cloud integration - Retrieve payment from cloud database

    return {
      data: input.data as Record<string, unknown>,
    };
  };

  updatePayment = async (
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Updating payment", input);
    }

    const paymentData = input.data as unknown as StellarPaymentData;

    // TODO: Cloud integration - Update payment in cloud database
    // TODO: Cloud integration - Recalculate amounts if needed

    paymentData.amount = input.amount.toString();

    return {
      data: paymentData as unknown as Record<string, unknown>,
    };
  };

  getWebhookActionAndData = async (
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> => {
    if (this.options.debug) {
      console.info("[Stellar] Processing webhook", payload);
    }

    // TODO: Cloud integration - Verify webhook signature
    // TODO: Cloud integration - Parse webhook payload from cloud service
    // TODO: Cloud integration - Map webhook events to Medusa actions
    // TODO: Cloud integration - Handle subscription renewal events
    // TODO: Cloud integration - Handle payment confirmation events

    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Webhooks are not yet supported for Stellar payments. Cloud integration required."
    );
  };

  createAccountHolder = async ({
    context,
    data,
  }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Creating account holder", context, data);
    }

    const { customer, account_holder } = context;

    if (account_holder?.data?.id) {
      return { id: account_holder.data.id as string };
    }

    if (!customer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Customer not found in context"
      );
    }

    // TODO: Cloud integration - Create customer in cloud database
    // TODO: Cloud integration - Link Stellar wallet addresses
    // TODO: Cloud integration - Set up customer payment preferences

    const customerId = crypto.randomUUID();

    return {
      id: customerId,
      data: {
        id: customerId,
        email: customer.email,
        stellar_addresses: [],
      },
    };
  };

  updateAccountHolder = async ({
    context,
    data,
  }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Updating account holder", context, data);
    }

    const { account_holder, customer } = context;

    if (!account_holder.data?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Account holder not found in context"
      );
    }

    if (!customer) {
      return {};
    }

    // TODO: Cloud integration - Update customer in cloud database
    // TODO: Cloud integration - Update linked Stellar addresses

    return {
      data: {
        id: account_holder.data.id,
        email: customer.email,
      },
    };
  };

  deleteAccountHolder = async ({
    context,
    data,
  }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Deleting account holder", context, data);
    }

    const { account_holder } = context;

    if (!account_holder.data?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Account holder not found in context"
      );
    }

    // TODO: Cloud integration - Delete customer from cloud database
    // TODO: Cloud integration - Clean up associated payment records

    return {};
  };
}

export * from "./types";
export * from "./utils";
