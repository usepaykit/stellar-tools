import { StellarTools } from "@stellartools/core";
import { InvalidArgumentError, generateObject, generateText, streamObject, streamText } from "ai";

import { StellarToolsAISDKOptions, stellarToolsAISDKOptionsSchema } from "./schema";

export class StellarToolsAISDK {
  private stellar: StellarTools;

  constructor(private config: StellarToolsAISDKOptions) {
    stellarToolsAISDKOptionsSchema.parse(config);
    this.stellar = new StellarTools({ apiKey: config.apiKey });
  }

  private async preflightCheck() {
    const res = await this.stellar.credits.check(this.config.customerId, {
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

  private async charge(tokens: number, operation: string) {
    if (tokens <= 0) return;

    await this.stellar.credits.consume(this.config.customerId, {
      productId: this.config.productId,
      rawAmount: tokens,
      reason: "deduct",
      metadata: { operation, source: "aisdk-adapter" },
    });
  }

  async generateText(args: Parameters<typeof generateText>[0]) {
    await this.preflightCheck();
    const result = await generateText(args);
    await this.charge(result.usage.totalTokens ?? 0, "generateText");
    return result;
  }

  async generateObject(args: Parameters<typeof generateObject>[0]) {
    await this.preflightCheck();
    const result = await generateObject(args);
    await this.charge(result.usage.totalTokens ?? 0, "generateObject");
    return result;
  }

  async streamText(args: Parameters<typeof streamText>[0]) {
    await this.preflightCheck();
    return streamText({
      ...args,
      onFinish: async (event) => {
        await this.charge(event.usage.totalTokens ?? 0, "streamText");
        if (args.onFinish) await args.onFinish(event);
      },
    });
  }

  async streamObject(args: Parameters<typeof streamObject>[0]) {
    await this.preflightCheck();
    return streamObject({
      ...args,
      onFinish: async (event) => {
        await this.charge(event.usage.totalTokens ?? 0, "streamObject");
        if (args.onFinish) await args.onFinish(event);
      },
    });
  }
}
