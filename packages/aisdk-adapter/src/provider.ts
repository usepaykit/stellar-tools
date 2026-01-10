import { StellarTools } from "@stellartools/core";
import {
  InvalidArgumentError,
  generateObject,
  generateText,
  streamObject,
  streamText,
} from "ai";

import {
  StellarToolsAISDKOptions,
  stellarToolsAISDKOptionsSchema,
} from "./schema";

export class StellarToolsAISDK {
  private stellar: StellarTools;
  private customerId: string;
  private productId: string;

  constructor(private config: StellarToolsAISDKOptions) {
    const { error } = stellarToolsAISDKOptionsSchema.safeParse(config);

    if (error) {
      throw new Error(`Invalid config: ${error.message}`);
    }

    this.stellar = new StellarTools({ apiKey: config.apiKey });
    this.customerId = config.customerId;
    this.productId = config.productId;
  }

  async generateText(...args: Parameters<typeof generateText>) {
    const checkResult = await this.stellar.credits.check(this.customerId, {
      productId: this.productId,
      rawAmount: 1,
    });

    if (checkResult.error) {
      throw new InvalidArgumentError({
        message: checkResult.error.message,
        parameter: "credits-check",
        value: undefined,
      });
    }

    const originalOnFinish = args[0].onStepFinish;

    const result = await generateText({
      ...args[0],
      onStepFinish: async (event) => {
        const tokens = event.usage?.totalTokens || 0;
        await this.stellar.credits.consume(this.customerId, {
          productId: this.productId,
          rawAmount: tokens,
          reason: "deduct",
          metadata: { operation: "generateText", source: "aisdk-adapter" },
        });

        if (originalOnFinish) await originalOnFinish(event);
      },
    });

    if (result.usage) {
      await this.stellar.credits.consume(this.customerId, {
        productId: this.productId,
        rawAmount: result.usage.totalTokens ?? 0,
        reason: "deduct",
        metadata: { operation: "generateText", source: "aisdk-adapter" },
      });
    }

    return result;
  }

  async streamText(...args: Parameters<typeof streamText>) {
    const checkResult = await this.stellar.credits.check(this.customerId, {
      productId: this.productId,
      rawAmount: 1,
    });

    if (checkResult.error) {
      throw new InvalidArgumentError({
        message: checkResult.error.message,
        parameter: "credits-check",
        value: undefined,
      });
    }

    const originalOnFinish = args[0].onFinish;

    return streamText({
      ...args[0],
      onFinish: async (event) => {
        const tokens = event.usage?.totalTokens || 0;
        await this.stellar.credits.consume(this.customerId, {
          productId: this.productId,
          rawAmount: tokens,
          reason: "deduct",
          metadata: { operation: "streamText", source: "aisdk-adapter" },
        });

        if (originalOnFinish) await originalOnFinish(event);
      },
    });
  }

  async generateObject(args: Parameters<typeof generateObject>) {
    const checkResult = await this.stellar.credits.check(this.customerId, {
      productId: this.productId,
      rawAmount: 1,
    });

    if (checkResult.error) {
      throw new InvalidArgumentError({
        message: checkResult.error.message,
        parameter: "credits-check",
        value: undefined,
      });
    }

    const result = await generateObject({ ...args[0] });

    if (result.usage) {
      await this.stellar.credits.consume(this.customerId, {
        productId: this.productId,
        rawAmount: result.usage.totalTokens ?? 0,
        reason: "deduct",
        metadata: { operation: "generateObject", source: "aisdk-adapter" },
      });
    }

    return result;
  }

  async streamObject(...args: Parameters<typeof streamObject>) {
    const checkResult = await this.stellar.credits.check(this.customerId, {
      productId: this.productId,
      rawAmount: 1,
    });

    if (checkResult.error) {
      throw new InvalidArgumentError({
        message: checkResult.error.message,
        parameter: "credits-check",
        value: undefined,
      });
    }

    const originalOnFinish = args[0].onFinish;

    return streamObject({
      ...args[0],
      onFinish: async (event) => {
        const tokens = event.usage?.totalTokens || 0;
        await this.stellar.credits.consume(this.customerId, {
          productId: this.productId,
          rawAmount: tokens,
          reason: "deduct",
          metadata: { operation: "streamObject", source: "aisdk-adapter" },
        });

        if (originalOnFinish) await originalOnFinish(event);
      },
    });
  }
}
