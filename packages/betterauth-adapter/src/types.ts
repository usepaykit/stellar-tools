import {
  Checkout,
  CreditBalance,
  Customer,
  Subscription,
} from "@stellartools/core";

export interface StellarToolsBetterAuthOptions {
  /**
   * The API key for the Stellar Tools API.
   */
  apiKey: string;

  /**
   * Whether to automatically create a customer when a user is created.
   * @default false
   */
  createCustomerOnSignUp?: boolean;

  /**
   * The credit low threshold
   * @default 10
   */
  creditLowThreshold?: number;

  /**
   * The function to call when a customer is created.
   */
  onCustomerCreated?: (customer: Customer) => Promise<void>;

  /**
   * The function to call when a checkout is completed.
   */
  onCheckoutComplete?: (data: Checkout) => Promise<void>;

  /**
   * The function to call when the credit balance is low.
   */
  onCreditsLow?: (data: CreditBalance) => Promise<void>;

  /**
   * The function to call when a subscription is created.
   */
  onSubscriptionCreated?: (data: Subscription) => Promise<void>;

  /**
   * The function to call when a subscription is canceled.
   */
  onSubscriptionCanceled?: (data: Subscription) => Promise<void>;

  /**
   * The function to call when a subscription is renewed.
   */
  onSubscriptionRenewed?: (data: Subscription) => Promise<void>;

  /**
   * The function to call when a subscription payment fails.
   */
  onSubscriptionPaymentFailed?: (data: Subscription) => Promise<void>;
}
