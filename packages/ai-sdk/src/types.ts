import { LanguageModel } from "ai";

export type CheckoutResult = {
  type: "checkout";
  checkout: {
    url: string;
  };
};

export type StellarResult<T> = T | CheckoutResult;

export interface StellarAIAdapterConfig {
  apiKey: string;
  customerId: string;
  model: LanguageModel;
  /**
   * Product ID for text generation operations (generateText, streamText)
   */
  textProductId?: string;
  /**
   * Product ID for embedding operations
   */
  embeddingProductId?: string;
  /**
   * Product ID for object generation operations (generateObject, streamObject)
   */
  objectProductId?: string;
  /**
   * Base URL for the Stellar Tools API
   * @default "https://localhost:3000"
   */
  baseUrl?: string;
  /**
   * Default checkout URL if credits are insufficient
   * @default "https://checkout.stellartools.com"
   */
  checkoutUrl?: string;
  /**
   * Whether to automatically consume credits after successful operations
   * @default true
   */
  autoConsumeCredits?: boolean;
  /**
   * Whether to check credit balance before operations
   * @default true
   */
  checkBalanceBeforeOperation?: boolean;
}
