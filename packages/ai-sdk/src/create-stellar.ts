import {
  CreditBalance,
  CreditTransaction,
  CreditTransactionHistoryParams,
  StellarTools,
} from "@stellartools/core";
import {
  EmbeddingModel,
  LanguageModel,
  StreamObjectResult,
  generateObject,
  generateText,
  streamObject,
  streamText,
} from "ai";
import { embed } from "ai";

import { CheckoutResult, StellarAIAdapterConfig } from "./types";

export class StellarAIAdapter {
  private apiKey: string;
  private customerId: string;
  private model: LanguageModel;
  private stellarTools: StellarTools;
  private checkBalanceBeforeOperation: boolean;
  private checkoutUrl: string;
  private autoConsumeCredits: boolean;
  private textProductId?: string;
  private embeddingProductId?: string;
  private objectProductId?: string;

  constructor(config: StellarAIAdapterConfig) {
    this.apiKey = config.apiKey;
    this.customerId = config.customerId;
    this.model = config.model;
    this.autoConsumeCredits = config.autoConsumeCredits ?? true;
    this.checkoutUrl =
      config.checkoutUrl ?? "https://checkout.stellartools.com";
    this.checkBalanceBeforeOperation =
      config.checkBalanceBeforeOperation ?? true;
    this.textProductId = config.textProductId;
    this.embeddingProductId = config.embeddingProductId;
    this.objectProductId = config.objectProductId;
    // Initialize StellarTools
    this.stellarTools = new StellarTools({
      apiKey: this.apiKey,
    });
  }

  /**
   * Check if customer has sufficient credits by attempting to get balance
   * Uses the consume flow which internally checks balance
   */
  private async checkCredits(
    productId: string
  ): Promise<CheckoutResult | null> {
    if (!this.checkBalanceBeforeOperation) {
      return null;
    }

    // Try to consume 0 credits - this will validate balance exists
    // The consume method already checks balance internally
    const result = await this.stellarTools.credit.consume(this.customerId, {
      productId,
      rawAmount: 0,
      reason: "balance_check",
      metadata: {
        operation: "balance_check",
      },
    });

    if (!result.ok) {
      // If consume fails (e.g., insufficient credits), return checkout
      return {
        type: "checkout",
        checkout: { url: this.checkoutUrl },
      };
    }

    return null;
  }

  /**
   * Consume credits based on usage
   */
  private async consumeCredits(
    productId: string,
    rawAmount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!this.autoConsumeCredits || rawAmount === 0) {
      return;
    }

    const result = await this.stellarTools.credit.consume(this.customerId, {
      productId,
      rawAmount,
      reason,
      metadata,
    });

    if (!result.ok) {
      console.warn(`Failed to consume credits: ${result.error.message}`);
      // Don't throw - we already completed the AI operation
    }
  }

  /**
   * Extract total tokens from AI SDK response
   */
  private getTotalTokens(response: any): number {
    if (response?.usage?.totalTokens) {
      return response.usage.totalTokens;
    }

    if (response?.response?.usage?.totalTokens) {
      return response.response.usage.totalTokens;
    }

    // Fallback: try to calculate from prompt/completion tokens
    if (response?.usage) {
      const { promptTokens, completionTokens, inputTokens, outputTokens } =
        response.usage;
      if (promptTokens && completionTokens) {
        return promptTokens + completionTokens;
      }
      if (inputTokens && outputTokens) {
        return inputTokens + outputTokens;
      }
    }

    return 0;
  }

  async generateText(
    args: Parameters<typeof generateText>[0]
  ): Promise<ReturnType<typeof generateText> | CheckoutResult> {
    const productId = this.textProductId;
    if (!productId) {
      throw new Error("textProductId is required for generateText operations");
    }

    const checkout = await this.checkCredits(productId);
    if (checkout) return checkout;

    const res = await generateText({
      ...args,
      model: this.model,
    });
    // Consume credits after successful operation
    if ("usage" in res) {
      const totalTokens = this.getTotalTokens(res);

      if (totalTokens) {
        await this.consumeCredits(productId, totalTokens, "generateText", {
          operation: "generateText",
          ...res.usage,
        });
      }
    }

    return res;
  }

  async streamText(
    args: Parameters<typeof streamText>[0]
  ): Promise<ReturnType<typeof streamText> | CheckoutResult> {
    const productId = this.textProductId;
    if (!productId) {
      throw new Error("textProductId is required for streamText operations");
    }

    // Check credits before operation (estimated check)
    const checkout = await this.checkCredits(productId);
    if (checkout) return checkout;

    // Note: For streaming, credits should be consumed in onFinish callback
    // This is a simplified version - in production, you'd want to wrap the stream
    return streamText({
      ...args,
      model: this.model,
    });
  }

  async embed(
    options: Parameters<typeof embed>[0]
  ): Promise<ReturnType<typeof embed> | CheckoutResult> {
    const productId = this.embeddingProductId;
    if (!productId) {
      throw new Error("embeddingProductId is required for embed operations");
    }

    // Check credits before operation
    const checkout = await this.checkCredits(productId);
    if (checkout) return checkout;

    const result = await embed({
      ...options,
      model: this.model as EmbeddingModel<string>,
    });

    // Consume credits based on usage
    if ("usage" in result) {
      const totalTokens = this.getTotalTokens(result);

      if (totalTokens > 0) {
        await this.consumeCredits(productId, totalTokens, "embed", {
          operation: "embed",
          ...result.usage,
        });
      }
    }

    return result;
  }

  async generateObject(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any
  ): Promise<Awaited<ReturnType<typeof generateObject>> | CheckoutResult> {
    const productId = this.objectProductId || this.textProductId;
    if (!productId) {
      throw new Error(
        "objectProductId or textProductId is required for generateObject operations"
      );
    }

    // Check credits before operation
    const checkout = await this.checkCredits(productId);
    if (checkout) return checkout;

    const result = await generateObject({
      ...options,
      model: this.model,
    });

    // Consume credits after successful operation
    if ("usage" in result) {
      const totalTokens = this.getTotalTokens(result);

      if (totalTokens) {
        await this.consumeCredits(productId, totalTokens, "generateObject", {
          operation: "generateObject",
          ...result.usage,
        });
      }
    }

    return result;
  }

  async streamObject(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any
  ): Promise<StreamObjectResult<unknown, unknown, never> | CheckoutResult> {
    const productId = this.objectProductId || this.textProductId;
    if (!productId) {
      throw new Error(
        "objectProductId or textProductId is required for streamObject operations"
      );
    }

    // Check credits before operation
    const checkout = await this.checkCredits(productId);
    if (checkout) return checkout;

    return streamObject({
      ...options,
      model: this.model,
    });
  }

  /**
   * Get credit transaction history
   */
  async getTransactions(
    productId: string,
    options?: Omit<CreditTransactionHistoryParams, "productId">
  ): Promise<CreditTransaction[]> {
    const result = await this.stellarTools.credit.getTransactions(
      this.customerId,
      { productId, ...options }
    );

    if (!result.ok) {
      throw new Error(`Failed to get transactions: ${result.error.message}`);
    }

    return result.value;
  }

  /**
   * Get a specific credit transaction
   */
  async getTransaction(transactionId: string): Promise<CreditTransaction> {
    const result = await this.stellarTools.credit.getTransaction(
      transactionId,
      this.customerId
    );

    if (!result.ok) {
      throw new Error(`Failed to get transaction: ${result.error.message}`);
    }

    return result.value;
  }

  /**
   * Refund credits to customer
   */
  async refundCredits(
    productId: string,
    amount: number,
    reason?: string,
    metadata?: Record<string, unknown>
  ): Promise<CreditBalance> {
    const result = await this.stellarTools.credit.refund(this.customerId, {
      productId,
      amount,
      reason,
      metadata,
    });

    if (!result.ok) {
      throw new Error(`Failed to refund credits: ${result.error.message}`);
    }

    return result.value;
  }

  /**
   * Create a checkout session
   */
  async createCheckout(params: {
    productId?: string;
    amount?: number;
    description?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ url: string }> {
    const result = await this.stellarTools.checkout.create({
      customerId: this.customerId,
      metadata: params.metadata ?? {},
      ...params,
    });

    if (!result.ok) {
      throw new Error(`Failed to create checkout: ${result.error.message}`);
    }

    return { url: result.value?.paymentUrl ?? "" };
  }
}

export function createStellarAI(
  config: StellarAIAdapterConfig
): StellarAIAdapter {
  return new StellarAIAdapter(config);
}
