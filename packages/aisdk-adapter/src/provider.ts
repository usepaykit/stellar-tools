import {
  InsufficientCreditsError,
  type MeteredPlugin,
  type MeteredPluginConfig,
  createMeteredPlugin,
} from "@stellartools/plugin-sdk";
import { InvalidArgumentError, generateObject, generateText, streamObject, streamText } from "ai";

export class MeteredAISDK {
  private plugin: MeteredPlugin;

  constructor(config: MeteredPluginConfig) {
    this.plugin = createMeteredPlugin(config);
  }

  private wrapError(err: unknown): never {
    if (err instanceof InsufficientCreditsError) {
      throw new InvalidArgumentError({
        message: err.message,
        parameter: "credits",
        value: err.required,
      });
    }
    throw err;
  }

  async generateText(customerId: string, ...args: Parameters<typeof generateText>) {
    try {
      return await this.plugin.meter(
        customerId,
        () => generateText(...args),
        (result) => result.usage.totalTokens ?? 0,
        { operation: "generateText" }
      );
    } catch (err) {
      this.wrapError(err);
    }
  }

  async generateObject(customerId: string, ...args: Parameters<typeof generateObject>) {
    try {
      return await this.plugin.meter(
        customerId,
        () => generateObject(...args),
        (result) => result.usage.totalTokens ?? 0,
        { operation: "generateObject" }
      );
    } catch (err) {
      this.wrapError(err);
    }
  }

  async streamText(customerId: string, ...args: Parameters<typeof streamText>) {
    try {
      await this.plugin.preflight(customerId);
    } catch (err) {
      this.wrapError(err);
    }

    const originalOnFinish = args[0]?.onFinish;

    return streamText({
      ...args[0],
      onFinish: async (event) => {
        await this.plugin.charge(customerId, event.usage.totalTokens ?? 0, { operation: "streamText" });
        await originalOnFinish?.(event);
      },
    });
  }

  async streamObject(customerId: string, ...args: Parameters<typeof streamObject>) {
    try {
      await this.plugin.preflight(customerId);
    } catch (err) {
      this.wrapError(err);
    }

    const originalOnFinish = args[0]?.onFinish;

    return streamObject({
      ...args[0],
      onFinish: async (event) => {
        await this.plugin.charge(customerId, event.usage.totalTokens ?? 0, { operation: "streamObject" });
        await originalOnFinish?.(event);
      },
    });
  }
}
