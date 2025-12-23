import { ApiClient } from "./api-client";
import { CheckoutApi } from "./resources/checkout";
import { CreditApi } from "./resources/credit";
import { CustomerApi } from "./resources/customers";
import { PaymentApi } from "./resources/payment";
import { ProductApi } from "./resources/product";
import { RefundApi } from "./resources/refund";
import { Webhook } from "./resources/webhook";
import { StellarToolsConfig, stellarToolsConfigSchema } from "./schema/shared";

export class StellarTools {
  private config: StellarToolsConfig;
  public webhook: Webhook;
  public customer: CustomerApi;
  public refund: RefundApi;
  public checkout: CheckoutApi;
  public payment: PaymentApi;
  public credit: CreditApi;
  public product: ProductApi;

  constructor(config: StellarToolsConfig) {
    const { error, data } = stellarToolsConfigSchema.safeParse(config);

    if (error) {
      throw new Error(`Invalid config: ${error.message}`);
    }

    this.config = data;

    const apiClient = new ApiClient({
      baseUrl: "https://localhost:3000",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
      },
      retryOptions: { max: 3, baseDelay: 1000, debug: false },
    });

    this.webhook = new Webhook();

    this.customer = new CustomerApi(apiClient);
    this.refund = new RefundApi(apiClient);
    this.checkout = new CheckoutApi(apiClient);
    this.payment = new PaymentApi(apiClient);
    this.credit = new CreditApi(apiClient);
    this.product = new ProductApi(apiClient);
  }
}

export * from "./types";
export * from "./resources/webhook";
export { schemaFor, tryCatchAsync, validateRequiredKeys } from "./utils";
export * from "./schema/customer";
export * from "./schema/checkout";
export * from "./schema/payment";
export * from "./schema/refund";
export * from "./schema/shared";
