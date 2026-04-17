import { InsufficientCreditsError, createMeteredPlugin } from "@stellartools/plugin-sdk";
import * as rawAI from "ai";

type StellarToolsParams = {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;
  /**
   * The customer ID.
   */
  customerId: string;
  /**
   * The product ID.
   */
  productId: string;
};

const handleError = (err: unknown): never => {
  if (err instanceof InsufficientCreditsError) {
    throw new rawAI.InvalidArgumentError({
      message: err.message,
      parameter: "credits",
      value: err.required,
    });
  }
  throw err;
};

export const generateText = async (params: StellarToolsParams, ...args: Parameters<typeof rawAI.generateText>) => {
  const { apiKey, customerId, productId } = params;

  if (!customerId || !productId) {
    return handleError(new Error("Customer ID and product ID are required"));
  }

  const plugin = createMeteredPlugin({ apiKey });

  try {
    return await plugin.meter(
      customerId,
      productId,
      () => rawAI.generateText(...args),
      (result) => result.usage.totalTokens ?? 0,
      { operation: "generateText" }
    );
  } catch (err) {
    handleError(err);
  }
};

export const generateObject = async <T>(
  params: StellarToolsParams,
  ...args: Parameters<typeof rawAI.generateObject>
) => {
  const { apiKey, customerId, productId } = params;

  if (!customerId || !productId) {
    return handleError(new Error("Customer ID and product ID are required"));
  }

  const plugin = createMeteredPlugin({ apiKey });

  try {
    return await plugin.meter(
      customerId,
      productId,
      () => rawAI.generateObject(...args),
      (result) => result.usage.totalTokens ?? 0,
      { operation: "generateObject" }
    );
  } catch (err) {
    handleError(err);
  }
};

export const streamText = async (params: StellarToolsParams, ...args: Parameters<typeof rawAI.streamText>) => {
  const { apiKey, customerId, productId } = params;

  if (!customerId || !productId) {
    return handleError(new Error("Customer ID and product ID are required"));
  }

  const plugin = createMeteredPlugin({ apiKey });

  try {
    await plugin.preflight(customerId, productId);
    const originalOnFinish = args[0]?.onFinish;

    return rawAI.streamText({
      ...args[0],
      onFinish: async (event) => {
        await plugin.charge(customerId, productId, event.usage.totalTokens ?? 0, {
          operation: "streamText",
        });
        if (originalOnFinish) await originalOnFinish(event);
      },
    });
  } catch (err) {
    handleError(err);
  }
};

export const streamObject = async <T>(params: StellarToolsParams, ...args: Parameters<typeof rawAI.streamObject>) => {
  const { apiKey, customerId, productId } = params;

  if (!customerId || !productId) {
    return handleError(new Error("Customer ID and product ID are required"));
  }

  const plugin = createMeteredPlugin({ apiKey });

  try {
    await plugin.preflight(customerId, productId);
    const originalOnFinish = args[0]?.onFinish;

    return rawAI.streamObject({
      ...args[0],
      onFinish: async (event) => {
        await plugin.charge(customerId, productId, event.usage.totalTokens ?? 0, {
          operation: "streamObject",
        });
        if (originalOnFinish) await originalOnFinish(event);
      },
    });
  } catch (err) {
    handleError(err);
  }
};

export * from "ai";
