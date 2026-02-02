import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentOutput,
  CreateAccountHolderInput,
  CreateAccountHolderOutput,
  DeleteAccountHolderInput,
  DeleteAccountHolderOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  UpdateAccountHolderInput,
  UpdateAccountHolderOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { AbstractPaymentProvider, MedusaError, PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils";
import { Result, z as Schema, StellarTools, validateSchema } from "@stellartools/core";

import { StellarToolsMedusaAdapterOptions, stellarToolsMedusaAdapterOptionsSchema } from "./schema";

export class StellarToolsMedusaAdapter extends AbstractPaymentProvider<StellarToolsMedusaAdapterOptions> {
  static identifier = "stellar";
  private stellar: StellarTools;

  constructor(cradle: any, options: StellarToolsMedusaAdapterOptions) {
    super(cradle, options);
    this.stellar = new StellarTools({ apiKey: options.apiKey });
  }

  static validateOptions(options: Record<string, unknown>) {
    const { error } = stellarToolsMedusaAdapterOptionsSchema.safeParse(options);
    if (error) throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message);
  }

  private log(msg: string, data?: any) {
    console.info(`[Stellar] ${msg}`, data ?? "");
  }

  private unwrap<T>(result: Result<T, Error>, errorCode = MedusaError.Types.UNEXPECTED_STATE): T {
    if (!result.isOk()) {
      throw new MedusaError(errorCode, result.error?.message ?? "Stellar operation failed");
    }
    return result.value;
  }

  private getCustomerId(input: any): string {
    const id = input?.data?.id || input?.id;
    if (!id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Stellar ID is missing from input data");
    return id;
  }

  initiatePayment = async ({
    context,
    amount,
    currency_code,
    data,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> => {
    this.log("Initiating payment", { amount, currency_code, data });

    if (currency_code !== "XLM") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Only XLM is supported");
    }

    return this.unwrap(
      (
        await Result.andThenAsync(
          validateSchema(Schema.object({ amount: Schema.number(), currency_code: Schema.string() }), {
            amount,
            currency_code,
          }),
          (valid) =>
            this.stellar.checkouts.create({
              amount: Number(valid.amount),
              assetCode: valid.currency_code,
              metadata: data?.metadata as any,
              description: (data?.description as string) ?? "Order Payment",
              customerId: context?.customer?.id as string,
              successUrl: data?.successUrl as string,
            })
        )
      ).map((checkout) => ({
        id: checkout.id,
        status: PaymentSessionStatus.REQUIRES_MORE,
        data: { payment_url: checkout.paymentUrl },
      }))
    );
  };

  getPaymentStatus = async (input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> => {
    const payment = this.unwrap(
      await this.stellar.payments.retrieve(this.getCustomerId(input), { verifyOnChain: true })
    );

    const statusMap: Record<string, PaymentSessionStatus> = {
      pending: PaymentSessionStatus.REQUIRES_MORE,
      confirmed: PaymentSessionStatus.AUTHORIZED,
      failed: PaymentSessionStatus.ERROR,
    };

    return {
      status: statusMap[payment.status] || PaymentSessionStatus.PENDING,
      data: payment as any,
    };
  };

  authorizePayment = async (input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> => {
    return this.getPaymentStatus(input);
  };

  capturePayment = async (): Promise<CapturePaymentOutput> => ({ data: { captured: true } });

  refundPayment = async (input: RefundPaymentInput): Promise<RefundPaymentOutput> => {
    const result = validateSchema(
      Schema.object({ receiverPublicKey: Schema.string(), reason: Schema.string().nullable() }),
      input.data
    );

    if (result.isErr()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, result.error?.message ?? "Invalid refund data");
    }

    const refund = this.unwrap(
      await this.stellar.refunds.create({
        paymentId: this.getCustomerId(input),
        amount: Number(input.amount),
        reason: result.value.reason ?? "Refund",
        metadata: { source: "medusa-adapter" },
        receiverPublicKey: result.value.receiverPublicKey,
      })
    );

    return { data: refund as any };
  };

  createAccountHolder = async ({ context }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> => {
    const { customer } = context;

    const res = this.unwrap(
      await this.stellar.customers.create({
        email: customer?.email,
        name: `${customer?.first_name} ${customer?.last_name}`.trim(),
        phone: customer?.phone ?? undefined,
        metadata: { source: "medusa-adapter" },
      })
    );

    return { id: res.id, data: res as any };
  };

  updateAccountHolder = async ({ context, data }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput> => {
    const { customer } = context;
    const res = this.unwrap(
      await this.stellar.customers.update(this.getCustomerId(context.account_holder), {
        email: customer?.email,
        name: `${customer?.first_name} ${customer?.last_name}`.trim(),
        phone: customer?.phone ?? undefined,
        metadata: data?.metadata as any,
      })
    );

    return { data: res as any };
  };

  deleteAccountHolder = async ({ context }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> => {
    const res = this.unwrap(await this.stellar.customers.delete(this.getCustomerId(context.account_holder)));
    return { data: res as any };
  };

  getWebhookActionAndData = async (payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> => {
    const body = JSON.parse(payload.rawData.toString());
    const actionMap: Record<string, PaymentActions> = {
      "payment.pending": PaymentActions.PENDING,
      "payment.confirmed": PaymentActions.SUCCESSFUL,
      "payment.failed": PaymentActions.FAILED,
      "checkout.expired": PaymentActions.CANCELED,
    };

    return {
      action: actionMap[body.event] || PaymentActions.NOT_SUPPORTED,
      data: { session_id: body.data?.metadata?.session_id, amount: body.data?.amount },
    };
  };

  cancelPayment = async () => {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Blockchain transactions are immutable");
  };
  deletePayment = async () => {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Blockchain transactions are immutable");
  };
  updatePayment = async () => {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Blockchain transactions are immutable");
  };

  retrievePayment = async (input: RetrievePaymentInput) => this.getPaymentStatus(input);
}
