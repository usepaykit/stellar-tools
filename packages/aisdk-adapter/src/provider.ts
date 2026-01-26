import { StellarTools } from "@stellartools/core";
import { InvalidArgumentError, generateObject, generateText, streamObject, streamText } from "ai";

import { MeterConfig, meterConfigSchema } from "./schema";

export class MeteredAISDK {
  private stellar: StellarTools;

  constructor(private config: MeterConfig) {
    meterConfigSchema.parse(config);
    this.stellar = new StellarTools({ apiKey: config.apiKey });
  }

  private async preflightCheck(customerId: string) {
    const res = await this.stellar.credits.check(customerId, {
      productId: this.config.productId,
      rawAmount: 1,
    });

    if (res.isErr()) {
      throw new InvalidArgumentError({
        message: res.error.message,
        parameter: "credits",
        value: 1,
      });
    }
  }

  private async charge(customerId: string, tokens: number, operation: string) {
    if (tokens <= 0) return;

    await this.stellar.credits.consume(customerId, {
      productId: this.config.productId,
      rawAmount: tokens,
      reason: "deduct",
      metadata: { adapter: "metered-aisdk", reason: `aisdk_${operation}` },
    });
  }

  async generateText(customerId: string, ...args: Parameters<typeof generateText>) {
    await this.preflightCheck(customerId);
    const result = await generateText(...args);
    await this.charge(customerId, result.usage.totalTokens ?? 0, "generateText");
    return result;
  }

  async generateObject(customerId: string, ...args: Parameters<typeof generateObject>) {
    await this.preflightCheck(customerId);
    const result = await generateObject(...args);
    await this.charge(customerId, result.usage.totalTokens ?? 0, "generateObject");
    return result;
  }

  async streamText(customerId: string, ...args: Parameters<typeof streamText>) {
    await this.preflightCheck(customerId);
    return streamText({
      ...args[0],
      onFinish: async (event) => {
        await this.charge(customerId, event.usage.totalTokens ?? 0, "streamText");
        if (args[0]?.onFinish) await args[0]?.onFinish(event);
      },
    });
  }

  async streamObject(customerId: string, ...args: Parameters<typeof streamObject>) {
    await this.preflightCheck(customerId);
    return streamObject({
      ...args[0],
      onFinish: async (event) => {
        await this.charge(customerId, event.usage.totalTokens ?? 0, "streamObject");
        if (args[0]?.onFinish) await args[0]?.onFinish(event);
      },
    });
  }
}
