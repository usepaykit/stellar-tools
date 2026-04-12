import {
  InsufficientCreditsError,
  type MeteredPlugin,
  type MeteredPluginConfig,
  createMeteredPlugin,
} from "@stellartools/plugin-sdk";
import * as AI from "ai";


type Props = {
  customerId: string;
  productId: string;
};
export class MeteredAISDK {
  private plugin: MeteredPlugin;

  constructor(config: MeteredPluginConfig) {
    this.plugin = createMeteredPlugin(config);
  }

  private wrapError(err: unknown): never {
    if (err instanceof InsufficientCreditsError) {
      throw new AI.InvalidArgumentError({
        message: err.message,
        parameter: "credits",
        value: err.required,
      });
    }
    throw err;
  }

  async generateText({customerId, productId}: Props, ...args: Parameters<typeof AI.generateText>) {
    try {
      return await this.plugin.meter(
        {customerId, productId},
        () => AI.generateText(...args),
        (result) => result.usage.totalTokens ?? 0,
        { operation: "generateText" }
      );
    } catch (err) {
      this.wrapError(err);
    }
  }

  async generateObject({customerId, productId}: Props, ...args: Parameters<typeof AI.generateObject>) {
    try {
      return await this.plugin.meter(
        {customerId, productId},
        () => AI.generateObject(...args),
        (result) => result.usage.totalTokens ?? 0,
        { operation: "generateObject" }
      );
    } catch (err) {
      this.wrapError(err);
    }
  }

  async streamText({customerId, productId}: Props, ...args: Parameters<typeof AI.streamText>) {
    try {
      await this.plugin.preflight({customerId, productId});
    } catch (err) {
      this.wrapError(err);
    }

    const originalOnFinish = args[0]?.onFinish;

    return AI.streamText({
      ...args[0],
      onFinish: async (event) => {
        await this.plugin.charge(customerId, event.usage.totalTokens ?? 0, { operation: "streamText" });
        await originalOnFinish?.(event);
      },
    });
  }

  async streamObject({customerId, productId}: Props, ...args: Parameters<typeof AI.streamObject>) {
    try {
      await this.plugin.preflight({customerId, productId});
    } catch (err) {
      this.wrapError(err);
    }

    const originalOnFinish = args[0]?.onFinish;

    return AI.streamObject({
      ...args[0],
      onFinish: async (event) => {
        await this.plugin.charge(customerId, event.usage.totalTokens ?? 0, { operation: "streamObject" });
        await originalOnFinish?.(event);
      },
    });
  }
}
