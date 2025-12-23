import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentOutput,
  CreateAccountHolderInput,
  CreateAccountHolderOutput,
  DeleteAccountHolderInput,
  DeleteAccountHolderOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdateAccountHolderInput,
  UpdateAccountHolderOutput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import { StellarTools, validateRequiredKeys } from "@stellartools/core";
import { z } from "zod";

const optionsSchema = z.object({
  apiKey: z.string(),
  debug: z.boolean().optional(),
});

export type StellarMedusaAdapterOptions = z.infer<typeof optionsSchema>;

export class StellarMedusaAdapter extends AbstractPaymentProvider<StellarMedusaAdapterOptions> {
  /**
   * The unique identifier for this payment provider
   */
  static identifier = "stellar";

  protected readonly options: StellarMedusaAdapterOptions;

  private stellar: StellarTools;

  static validateOptions(options: Record<string, unknown>): void | never {
    const { error } = optionsSchema.safeParse(options);

    if (error) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message);
    }

    return;
  }

  /**
   * Constructor receives Medusa's container and provider options
   *
   * @param cradle - Medusa's dependency injection container
   * @param options - Stellar provider configuration
   */
  constructor(
    cradle: Record<string, unknown>,
    options: StellarMedusaAdapterOptions
  ) {
    super(cradle, options);

    this.options = options;

    const debug = this.options.debug ?? false;

    if (debug) {
      console.info(
        `[Stellar] Initialized with API key: ${this.options.apiKey}`
      );
    }

    this.stellar = new StellarTools({
      apiKey: this.options.apiKey,
      debug,
    });
  }

  initiatePayment = async ({
    context,
    amount,
    currency_code = "XLM",
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Initiating payment", { amount, currency_code });
    }

    const checkout = await this.stellar.checkout.create({
      amount: Number(amount),
      assetCode: currency_code,
      metadata: data?.metadata as Record<string, unknown>,
      description: (data?.description as string) ?? "Payment for order",
      customerId: context?.customer?.id as string,
    });

    if (!checkout.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        checkout.error?.message ?? "Failed to create checkout"
      );
    }

    return {
      id: checkout.value.id,
      status: PaymentSessionStatus.REQUIRES_MORE,
      data: { payment_url: checkout.value.paymentUrl },
    };
  };

  capturePayment = async (): Promise<CapturePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Capture requested (no-op for Stellar)");
    }

    return { data: { captured: true } };
  };

  authorizePayment = async (
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Authorizing payment", input);
    }

    return this.getPaymentStatus(input);
  };

  cancelPayment = async (
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Canceling payment", input);
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Cannot cancel payment as the blockchain is immutable"
    );
  };

  deletePayment = async (
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> => {
    return this.cancelPayment(input);
  };

  getPaymentStatus = async (
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> => {
    const { id: paymentId } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const payment = await this.stellar.payment.retrieve(paymentId, {
      verifyOnChain: true,
    });

    if (!payment.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        payment.error?.message ?? "Failed to retrieve payment"
      );
    }

    const statusMap: Record<string, PaymentSessionStatus> = {
      pending: PaymentSessionStatus.REQUIRES_MORE,
      confirmed: PaymentSessionStatus.AUTHORIZED,
      failed: PaymentSessionStatus.ERROR,
    };

    return {
      status: statusMap[payment.value.status] || PaymentSessionStatus.PENDING,
      data: payment.value as unknown as Record<string, unknown>,
    };
  };

  refundPayment = async (
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Refunding payment", input);
    }

    const { id: paymentId, receiverPublicKey } = validateRequiredKeys(
      ["id", "receiverPublicKey"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const refund = await this.stellar.refund.create({
      paymentId,
      amount: Number(input.amount),
      reason: (input.data?.reason as string) ?? "Refund for order",
      metadata: (input.data?.metadata as Record<string, unknown>) ?? {},
      receiverPublicKey,
    });

    if (!refund.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        refund.error?.message ?? "Failed to create refund"
      );
    }

    return { data: refund as Record<string, unknown> };
  };

  retrievePayment = async (
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Retrieving payment", input);
    }

    const { id: paymentId } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const payment = await this.stellar.payment.retrieve(paymentId, {
      verifyOnChain: true,
    });

    if (!payment.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        payment.error?.message ?? "Failed to retrieve payment"
      );
    }

    return { data: payment.value as unknown as Record<string, unknown> };
  };

  updatePayment = async (): Promise<UpdatePaymentOutput> => {
    if (this.options.debug) {
      console.info("[Stellar] Update payment requested");
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Cannot update payment as the blockchain is immutable"
    );
  };

  getWebhookActionAndData = async (
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> => {
    if (this.options.debug) {
      console.info("[StellarTools] Getting webhook action and data", payload);
    }

    const body = JSON.parse(payload.rawData.toString());

    const eventActionMap: Record<string, PaymentActions> = {
      "payment.pending": PaymentActions.PENDING,
      "payment.confirmed": PaymentActions.SUCCESSFUL,
      "payment.failed": PaymentActions.FAILED,
      "checkout.completed": PaymentActions.SUCCESSFUL,
      "checkout.expired": PaymentActions.CANCELED,
    };

    return {
      action: eventActionMap[body.event] || PaymentActions.NOT_SUPPORTED,
      data: {
        session_id: body.data?.metadata?.session_id,
        amount: body.data?.amount,
      },
    };
  };

  createAccountHolder = async ({
    context,
    data,
  }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Creating account holder", context, data);
    }

    const { customer } = context;

    const metadata =
      typeof data?.metadata === "object" && data?.metadata !== null
        ? (data.metadata as Record<string, unknown>)
        : {};

    const stellarCustomer = await this.stellar.customer.create({
      email: customer?.email,
      name: `${customer?.first_name} ${customer?.last_name}`,
      phone: customer?.phone ?? undefined,
      appMetadata: { source: "medusa-adapter", ...(metadata ?? {}) },
    });

    if (!stellarCustomer.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        stellarCustomer.error?.message ?? "Failed to create customer"
      );
    }

    return {
      id: stellarCustomer.value.id,
      data: stellarCustomer.value as unknown as Record<string, unknown>,
    };
  };

  updateAccountHolder = async ({
    context,
    data,
  }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Updating account holder", context, data);
    }

    const accountHolderId = context.account_holder?.data?.id as string;

    const { customer } = context;

    if (!customer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Customer not found in context"
      );
    }

    const updatedCustomer = await this.stellar.customer.update(
      accountHolderId,
      {
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`,
        phone: customer.phone ?? undefined,
        appMetadata: data?.metadata as Record<string, unknown>,
      }
    );

    if (!updatedCustomer.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        updatedCustomer.error?.message ?? "Failed to update customer"
      );
    }

    return {
      data: updatedCustomer.value as unknown as Record<string, unknown>,
    };
  };

  deleteAccountHolder = async ({
    context,
    data,
  }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Deleting account holder", context, data);
    }

    const accountHolderId = context.account_holder?.data?.id as string;

    const result = await this.stellar.customer.delete(accountHolderId);

    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        result.error?.message ?? "Failed to delete customer"
      );
    }

    return { data: result.value as unknown as Record<string, unknown> };
  };
}
