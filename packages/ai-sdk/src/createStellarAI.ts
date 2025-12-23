import { EmbeddingModel, LanguageModel, generateText, streamText, generateObject, streamObject, StreamObjectResult } from "ai";
import { checkBilling } from "./billings";
import { CheckoutResult } from "./types";
import { embed } from "ai";

export class StellarAI {
  private apiKey: string;
  private customerId: string;
  private model: LanguageModel;

  constructor({
    apiKey,
    customerId,
    model,
  }: {
    apiKey: string;
    customerId: string;
    model: LanguageModel;
  }) {
    this.apiKey = apiKey;
    this.customerId = customerId;
    this.model = model;
  }

  private async checkBillingAndGetCheckout(): Promise<CheckoutResult | null> {
    const billing = await checkBilling({
      apiKey: this.apiKey,
      customerId: this.customerId,
      usage: 1,
    });

    if (!billing) {
      return {
        type: "checkout",
        checkout: { url: "https://checkout.stellartools.com" },
      };
    }

    return null;
  }

  async generateText(
    args: Parameters<typeof generateText>[0]
  ): Promise<ReturnType<typeof generateText> | CheckoutResult> {
    const checkout = await this.checkBillingAndGetCheckout();
    if (checkout) return checkout;

    return await generateText({
      ...args,
      model: this.model,
    });
  }

  async streamText(
    args: Parameters<typeof streamText>[0]
  ): Promise<ReturnType<typeof streamText> | CheckoutResult> {
    const checkout = await this.checkBillingAndGetCheckout();
    if (checkout) return checkout;

    return streamText({
      ...args,
      model: this.model,
    });
  }

  async embed(
    options: Parameters<typeof embed>[0]
  ): Promise<ReturnType<typeof embed> | CheckoutResult> {
    const checkout = await this.checkBillingAndGetCheckout();
    if (checkout) return checkout;

    return await embed({
      ...options,
      model: this.model as EmbeddingModel<string>,
    });
  }


  async generateObject(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any
  ): Promise<Awaited<ReturnType<typeof generateObject>> | CheckoutResult> {
    const checkout = await this.checkBillingAndGetCheckout();
    if (checkout) return checkout;

    return await generateObject({
      ...options,
      model: this.model,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async streamObject(options: any): Promise<StreamObjectResult<unknown, unknown, never> | CheckoutResult> {
    const checkout = await this.checkBillingAndGetCheckout();
    if (checkout) return checkout;

    return streamObject({
      ...options,
      model: this.model,
    });
  }
}

export function createStellarAI({
  apiKey,
  customerId,
  model,
}: {
  apiKey: string;
  customerId: string;
  model: LanguageModel;
}): StellarAI {
  return new StellarAI({ apiKey, customerId, model });
}
