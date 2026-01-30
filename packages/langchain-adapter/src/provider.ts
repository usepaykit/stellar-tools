import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { BaseMessageChunk } from "@langchain/core/messages";
import { StellarTools } from "@stellartools/core";

import { MeterConfig, meterConfigSchema } from "./schema";

export class MeteredLangChain<TModel extends BaseLanguageModel = BaseLanguageModel> {
  private stellar: StellarTools;

  constructor(
    private config: MeterConfig,
    private model: TModel
  ) {
    meterConfigSchema.parse(config);
    this.stellar = new StellarTools({ apiKey: config.apiKey });
  }

  private extractTokens(output: any): number {
    // 1. Standardized metadata (Standard for all modern LC integrations, 0.2+, 0.3+)
    if (output?.usage_metadata?.total_tokens) {
      return output.usage_metadata.total_tokens;
    }

    // 2. Fallback to raw response metadata (Provider specific)
    const usage = output?.response_metadata?.usage || output?.response_metadata?.tokenUsage;
    if (usage) {
      return (
        usage.totalTokens ??
        usage.total_tokens ??
        (usage.promptTokens ?? usage.prompt_tokens ?? 0) + (usage.completionTokens ?? usage.completion_tokens ?? 0)
      );
    }

    return 0;
  }

  private async preflight(customerId: string) {
    const res = await this.stellar.credits.check(customerId, {
      productId: this.config.productId,
      rawAmount: 1,
    });

    if (res.isErr()) {
      throw new Error(`[Stellar] Billing Block: ${res.error.message}`);
    }
  }

  private async charge(customerId: string, tokens: number, op: string) {
    if (tokens <= 0) return;

    this.stellar.credits.consume(customerId, {
      productId: this.config.productId,
      rawAmount: tokens,
      reason: "deduct",
      metadata: {
        model: this.model.constructor.name,
        adapter: "langchain-meter",
        reason: `langchain_${op}`,
      },
    });
  }

  // --- Metered Call Methods ---

  async invoke(customerId: string, ...args: Parameters<TModel["invoke"]>): Promise<ReturnType<TModel["invoke"]>> {
    await this.preflight(customerId);
    const result = await this.model.invoke(args[0], args[1]);

    this.charge(customerId, this.extractTokens(result), "invoke");
    return result as any;
  }

  async *stream(customerId: string, ...args: Parameters<TModel["stream"]>): AsyncGenerator<BaseMessageChunk> {
    await this.preflight(customerId);
    const stream = await this.model.stream(args[0], args[1]);

    let usageFound = 0;
    for await (const chunk of stream) {
      yield chunk;
      const tokens = this.extractTokens(chunk);
      if (tokens > 0) usageFound = tokens;
    }

    if (usageFound > 0) this.charge(customerId, usageFound, "stream");
  }

  async batch(customerId: string, ...args: Parameters<TModel["batch"]>): Promise<ReturnType<TModel["batch"]>> {
    await this.preflight(customerId);
    const results = await this.model.batch(args[0], args[1]);

    const total = results.reduce((acc, r) => acc + this.extractTokens(r), 0);
    this.charge(customerId, total, "batch");

    return results as any;
  }

  async *streamEvents(customerId: string, ...args: Parameters<TModel["streamEvents"]>): AsyncGenerator<any> {
    await this.preflight(customerId);
    const events = this.model.streamEvents(args[0], args[1]);

    let total = 0;
    for await (const event of events) {
      yield event;

      if (event.event === "on_chat_model_end" || event.event === "on_llm_end") {
        total += this.extractTokens(event.data.output);
      }
    }

    if (total > 0) this.charge(customerId, total, "streamEvents");
  }
}
