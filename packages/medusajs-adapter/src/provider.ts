import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
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
  UpdatePaymentInput,
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

const optionsSchema = z.object({
  apiKey: z.string(),
  debug: z.boolean().optional(),
});

export type StellarMedusaAdapterOptions = z.infer<typeof optionsSchema>;

export class StellarMedusaAdapter extends AbstractPaymentProvider<StellarMedusaAdapterOptions> {
  /**
   * The unique identifier for this payment provider
   */
  static identifier = "pp_stellar";

  protected readonly options: StellarMedusaAdapterOptions;

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

    if (this.options.debug) {
      console.info(
        `[Stellar] Initialized with API key: ${this.options.apiKey}`
      );
    }
  }

  initiatePayment = async ({
    context,
    amount,
    currency_code,
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Initiating payment", {
        context,
        amount,
        currency_code,
        data,
      });
    }

    const intent: Record<string, unknown> = {
      amount: Number(amount),
      currency: currency_code,
      metadata: {
        ...(data?.metadata ?? {}),
        session_id: data?.session_id ?? null,
      },
      provider_metadata: data?.provider_metadata as
        | Record<string, unknown>
        | undefined,
      capture_method: "manual",
      item_id: data?.item_id as string | null,
    };

    let customer: Payee | undefined;

    if (context?.account_holder?.data?.id) {
      customer = context.account_holder.data.id as Payee;
    }

    if (data?.email) {
      customer = { email: data.email } as Payee;
    }

    if (!customer) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Required: customer ID (account_holder) or email (data)"
      );
    }

    if (typeof customer === "object" && "email" in customer) {
      const customerName = data?.name
        ? (data.name as string)
        : (customer.email.split("@")[0] as string);

      const [createdCustomer, createError] = await tryCatchAsync(
        this.paykit.customers.create({
          email: customer.email,
          phone: (data?.phone as string) ?? "",
          name: customerName,
          metadata: {
            PAYKIT_METADATA_KEY: JSON.stringify({
              source: "medusa-paykit-adapter",
            }),
          },
        })
      );

      if (createError) {
        if (createError.name === "ProviderNotSupportedError") {
          if (this.options.debug) {
            console.info(
              `[PayKit] Provider ${this.provider.providerName} doesn't support customer creation, using email object`
            );
          }
        } else {
          throw new MedusaError(
            MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
            `Failed to create customer: ${createError.message}`
          );
        }
      } else {
        customer = createdCustomer.id;
      }
    } else {
      customer = customer as string;
    }

    intent.customer = customer;

    const [paymentIntentResult, paymentIntentError] = await tryCatchAsync(
      this.paykit.payments.create(intent as unknown as CreatePaymentSchema)
    );

    if (paymentIntentError) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        paymentIntentError.message
      );
    }

    if (
      paymentIntentResult.requires_action &&
      paymentIntentResult.payment_url
    ) {
      return {
        id: paymentIntentResult.id,
        status: PaymentSessionStatus.REQUIRES_MORE,
        data: {
          payment_url: paymentIntentResult.payment_url,
        },
      };
    }

    return {
      id: paymentIntentResult.id,
      status: medusaStatus$InboundSchema(paymentIntentResult.status),
    };
  };

  capturePayment = async (
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Capturing payment", input);
    }

    const { id, amount } = validateRequiredKeys(
      ["id", "amount"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const [paymentIntentResult, paymentIntentError] = await tryCatchAsync(
      this.paykit.payments.capture(id, { amount: Number(amount) })
    );

    if (paymentIntentError)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        paymentIntentError.message
      );

    return { data: paymentIntentResult as unknown as Record<string, unknown> };
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
      console.info("[PayKit] Canceling payment", input);
    }

    const { id } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const [paymentIntentResult, paymentIntentError] = await tryCatchAsync(
      this.paykit.payments.cancel(id)
    );

    if (paymentIntentError)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        paymentIntentError.message
      );

    return { data: paymentIntentResult as unknown as Record<string, unknown> };
  };

  deletePayment = async (
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> => {
    return this.cancelPayment(input);
  };

  getPaymentStatus = async (
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> => {
    const { id } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const [paymentIntentResult, paymentIntentError] = await tryCatchAsync(
      this.paykit.payments.retrieve(id)
    );

    if (paymentIntentError)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        paymentIntentError.message
      );

    if (!paymentIntentResult)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Payment not found"
      );

    return {
      status: medusaStatus$InboundSchema(paymentIntentResult.status),
      data: paymentIntentResult as unknown as Record<string, unknown>,
    };
  };

  refundPayment = async (
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Refunding payment", input);
    }

    const { id: paymentId } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const [refundResult, refundError] = await tryCatchAsync(
      this.paykit.refunds.create({
        payment_id: paymentId,
        amount: Number(input.amount),
        reason: null,
        metadata: input.data?.metadata
          ? (input.data.metadata as unknown as PaykitMetadata)
          : null,
        provider_metadata: input.data?.provider_metadata
          ? (input.data.provider_metadata as unknown as Record<string, unknown>)
          : undefined,
      })
    );

    if (refundError)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        refundError.message
      );

    return { data: refundResult as unknown as Record<string, unknown> };
  };

  retrievePayment = async (
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Retrieving payment", input);
    }

    const { id } = validateRequiredKeys(
      ["id"],
      (input?.data ?? {}) as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const [paymentIntentResult, paymentIntentError] = await tryCatchAsync(
      this.paykit.payments.retrieve(id)
    );

    if (paymentIntentError)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        paymentIntentError.message
      );

    return { data: paymentIntentResult as unknown as Record<string, unknown> };
  };

  updatePayment = async (
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Updating payment", input);
    }

    const { amount, currency_code } = validateRequiredKeys(
      ["amount", "currency_code"],
      input as unknown as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const { id: paymentId } = validateRequiredKeys(
      ["id"],
      input.data as Record<string, string>,
      "Missing required fields: {keys}",
      (message) => new MedusaError(MedusaError.Types.INVALID_DATA, message)
    );

    const metadata = input.data?.metadata ?? ({} as PaykitMetadata);

    const [paymentIntentResult, paymentIntentError] = await tryCatchAsync(
      this.paykit.payments.update(paymentId, {
        amount: Number(amount),
        currency: currency_code,
        metadata: stringifyMetadataValues(metadata),
        provider_metadata: input.data?.provider_metadata
          ? (input.data.provider_metadata as unknown as Record<string, unknown>)
          : undefined,
      })
    );

    if (paymentIntentError)
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        paymentIntentError.message
      );

    return { data: paymentIntentResult as unknown as Record<string, unknown> };
  };

  getWebhookActionAndData = async (
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> => {
    if (this.options.debug) {
      console.info("[PayKit] Getting webhook action and data", payload);
    }

    const { rawData, headers } = payload;

    const bodyString = Buffer.isBuffer(rawData)
      ? rawData.toString("utf8")
      : rawData;

    const webhook = this.paykit.webhooks
      .setup({ webhookSecret: this.options.webhookSecret })
      .on("payment.created", async (event) => {
        return {
          action: PaymentActions.PENDING,
          data: {
            session_id: event.data?.metadata?.session_id as string,
            amount: event.data?.amount,
          },
        };
      })
      .on("payment.updated", async (event) => {
        const statusActionMap: Record<PaymentStatus, string> = {
          pending: PaymentActions.PENDING,
          processing: PaymentActions.PENDING,
          requires_action: PaymentActions.REQUIRES_MORE,
          requires_capture: PaymentActions.AUTHORIZED,
          succeeded: PaymentActions.SUCCESSFUL,
          failed: PaymentActions.FAILED,
          canceled: PaymentActions.CANCELED,
        };

        return {
          action: event.data?.status
            ? statusActionMap[event.data.status]
            : PaymentActions.PENDING,
          data: {
            session_id: event.data?.metadata?.session_id as string,
            amount: event.data?.amount,
          },
        };
      })
      .on("payment.canceled", async (event) => {
        return {
          action: PaymentActions.CANCELED,
          data: {
            session_id: event.data?.metadata?.session_id as string,
            amount: event.data?.amount,
          },
        };
      });

    const stringifiedHeaders = Object.fromEntries(
      Object.entries(headers).map(([key, value]) => [key, String(value)])
    );

    const webhookEvents = await webhook.handle({
      body: bodyString,
      headers: new Headers(stringifiedHeaders),
      fullUrl: getURLFromHeaders(stringifiedHeaders),
    });

    return webhookEvents as unknown as WebhookActionResult;
  };

  createAccountHolder = async ({
    context,
    data,
  }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Creating account holder", context, data);
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

    const [accountHolderResult, accountHolderError] = await tryCatchAsync(
      this.paykit.customers.create({
        email: customer.email as string,
        name: customer.email.split("@")[0] as string,
        phone: customer.phone as string,
        metadata: {
          PAYKIT_METADATA_KEY: JSON.stringify({
            source: "medusa-paykit-adapter",
          }),
        },
      })
    );

    if (accountHolderError) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        accountHolderError.message
      );
    }

    return {
      id: accountHolderResult.id,
      data: accountHolderResult as unknown as Record<string, unknown>,
    };
  };

  updateAccountHolder = async ({
    context,
    data,
  }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Updating account holder", context, data);
    }

    const { account_holder, customer, idempotency_key } = context;

    if (!account_holder.data?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Account holder not found in context"
      );
    }

    // If no customer context was provided, we simply don't update anything within the provider
    if (!customer) {
      return {};
    }

    const accountHolderId = account_holder.data.id as string;

    const [accountHolderResult, accountHolderError] = await tryCatchAsync(
      this.paykit.customers.update(accountHolderId, {
        email: customer.email as string,
        name: customer.email.split("@")[0] as string,
        phone: customer.phone as string,
        ...((data?.metadata as unknown as PaykitMetadata) && {
          metadata: stringifyMetadataValues(
            (data?.metadata as unknown as PaykitMetadata) ?? {}
          ),
        }),
      })
    );

    if (accountHolderError) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        accountHolderError.message
      );
    }

    return { data: accountHolderResult as unknown as Record<string, unknown> };
  };

  deleteAccountHolder = async ({
    context,
    data,
  }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> => {
    if (this.options.debug) {
      console.info("[PayKit] Deleting account holder", context, data);
    }

    const { account_holder } = context;

    if (!account_holder.data?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Account holder not found in context"
      );
    }

    const accountHolderId = account_holder.data.id as string;

    const [accountHolderResult, accountHolderError] = await tryCatchAsync(
      this.paykit.customers.delete(accountHolderId)
    );

    if (accountHolderError) {
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        accountHolderError.message
      );
    }

    return { data: accountHolderResult as unknown as Record<string, unknown> };
  };
}
