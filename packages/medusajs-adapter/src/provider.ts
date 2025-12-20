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
import { z } from "zod";

import { ApiClient } from "./api-client";
import { tryCatchAsync, validateRequiredKeys } from "./utils";

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

  private apiClient: ApiClient;

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

    this.apiClient = new ApiClient({
      baseUrl: "http://localhost:3000",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.options.apiKey,
      },
      retryOptions: { max: 3, baseDelay: 1000, debug },
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

    const [checkoutResult, checkoutError] = await tryCatchAsync(
      this.apiClient.post<{ id: string; paymentUrl: string }>(
        "/api/checkouts",
        {
          body: JSON.stringify({
            amount: Number(amount),
            assetCode: currency_code,
            metadata: data?.metadata ?? {},
            description: data?.description ?? "Payment for order",
            customerId: context?.customer?.id,
          }),
        }
      )
    );

    if (!checkoutResult?.ok) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        checkoutError?.message ?? "Failed to create checkout"
      );
    }

    return {
      id: checkoutResult.value.id,
      status: PaymentSessionStatus.REQUIRES_MORE,
      data: { payment_url: checkoutResult.value.paymentUrl },
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
      console.info("[PayKit] Authorizing payment", input);
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

    const result = await this.apiClient.get<{
      id: string;
      status: "pending" | "confirmed" | "failed";
      transaction_hash?: string;
      amount: number;
    }>(`/api/payments/${paymentId}`);

    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.error.message
      );
    }

    const statusMap: Record<string, PaymentSessionStatus> = {
      pending: PaymentSessionStatus.REQUIRES_MORE,
      confirmed: PaymentSessionStatus.AUTHORIZED,
      failed: PaymentSessionStatus.ERROR,
    };

    return {
      status: statusMap[result.value.status] || PaymentSessionStatus.PENDING,
      data: result.value,
    };
  };

  refundPayment = async (
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Refunding payment", input);
    }

    const { id: paymentId } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const result = await this.apiClient.post<{ id: string }>("/api/refunds", {
      body: JSON.stringify({
        paymentId,
        amount: input.amount,
        reason: input.data?.reason,
        metadata: input.data?.metadata,
      }),
    });

    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.error.message
      );
    }

    return { data: result.value as Record<string, unknown> };
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

    const result = await this.apiClient.get<{
      id: string;
      status: "pending" | "confirmed" | "failed";
      transaction_hash?: string;
      amount: number;
    }>(`/api/payments/${paymentId}`);

    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.error.message
      );
    }

    return { data: result.value };
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

    const result = await this.apiClient.post<{ id: string }>("/api/customers", {
      body: JSON.stringify({
        email: customer?.email,
        name: `${customer?.first_name} ${customer?.last_name}`,
        phone: customer?.phone,
        internalMetadata: { source: "medusa-adapter" },
        ...(metadata && { appMetadata: metadata }),
      }),
    });
    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.error.message
      );
    }

    return { id: result.value.id, data: result.value };
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

    const result = await this.apiClient.patch<{ id: string }>(
      `/api/customers/${accountHolderId}`,
      {
        body: JSON.stringify({
          email: customer.email,
          name: `${customer.first_name} ${customer.last_name}`,
          phone: customer.phone,
          appMetadata: data?.metadata,
        }),
      }
    );

    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.error.message
      );
    }

    return { data: result.value };
  };

  deleteAccountHolder = async ({
    context,
    data,
  }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[StellarTools] Deleting account holder", context, data);
    }

    const accountHolderId = context.account_holder?.data?.id as string;

    const result = await this.apiClient.delete<{ id: string }>(
      `/api/customers/${accountHolderId}`
    );

    if (!result.ok) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        result.error.message
      );
    }

    return { data: result.value };
  };
}
