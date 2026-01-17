import {
  AuthProvider,
  authProviderEnum as authProviderEnum$1,
  checkoutStatus,
  eventTypeEnum as eventTypeEnum$1,
  networkEnum as networkEnum$1,
  payoutStatusEnum as payoutStatusEnum$1,
  roles,
} from "@/constant/schema.client";
import { WebhookEvent } from "@stellartools/core";
import { InferSelectModel, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const networkEnum = pgEnum("network", networkEnum$1);

export const authProviderEnum = pgEnum("auth_provider", authProviderEnum$1);

export type AccountSSOOption = {
  provider: AuthProvider;
  sub: string;
};

export type AccountProfile = {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
};

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  profile: jsonb("profile").$type<AccountProfile>(),
  sso: jsonb("sso").$type<{ values: Array<AccountSSOOption> }>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<object | null>(),
});

export const auth = pgTable("auth", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  provider: authProviderEnum("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
});

export const organizations = pgTable("organization", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  socialLinks: jsonb("social_links").$type<Record<string, string> | null>(),
  settings: jsonb("settings").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
});

export const organizationSecrets = pgTable("organization_secret", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  testnetSecretEncrypted: text("testnet_secret_encrypted").notNull(),
  testnetSecretVersion: integer("testnet_secret_version")
    .notNull()
    .default(parseInt(process.env.ENCRYPTION_KEY_VERSION!)),
  testnetPublicKey: text("testnet_public_key").notNull(),
  mainnetSecretEncrypted: text("mainnet_secret_encrypted"),
  mainnetSecretVersion: integer("mainnet_secret_version")
    .notNull()
    .default(parseInt(process.env.ENCRYPTION_KEY_VERSION!)),
  mainnetPublicKey: text("mainnet_public_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const secretAccessLogActionEnum = pgEnum("secret_access_log_action", [
  "decrypt",
  "rotate",
  "backup",
]);

export const secretAccessLog = pgTable("secret_access_log", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  secretId: text("secret_id")
    .notNull()
    .references(() => organizationSecrets.id),
  action: secretAccessLogActionEnum("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  environment: networkEnum("network").notNull(),
});

export const roleEnum = pgEnum("role", roles);

export const teamMembers = pgTable(
  "team_member",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id),
    role: roleEnum("role").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    uniqueOrgAccount: unique().on(table.organizationId, table.accountId),
  })
);

export const teamInviteStatusEnum = pgEnum("team_invite_status", [
  "pending",
  "accepted",
  "rejected",
]);

export const teamInvites = pgTable("team_invite", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(),
  status: teamInviteStatusEnum("status").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  role: roleEnum("role").notNull(),
});

export const apiKeys = pgTable("api_key", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  token: text("token").notNull().unique(),
  scope: jsonb("scope").$type<string[]>().notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  environment: networkEnum("network").notNull(),
});

export const assetCodeEnum = pgEnum("asset_code", ["XLM", "USDC"]);

export const assets = pgTable(
  "asset",
  {
    id: text("id").primaryKey(),
    code: assetCodeEnum("code").notNull(),
    issuer: text("issuer"),
    network: networkEnum("network").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  },
  (table) => ({
    uniqueCodeIssuerNetwork: unique().on(table.code, table.issuer, table.network),
  })
);

export type CustomerMetadata = Record<string, string>;

export type CustomerWalletAddress = {
  address: string;
  memo?: string;
};

export const customers = pgTable(
  "customer",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    email: text("email"),
    name: text("name"),
    phone: text("phone"),
    metadata: jsonb("metadata").$type<CustomerMetadata | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    environment: networkEnum("network").notNull(),
    walletAddresses: jsonb("wallet_addresses").$type<CustomerWalletAddress[]>(),
  },
  (table) => ({
    uniqueOrgEmail: unique().on(table.organizationId, table.email),
  })
);

export const productStatusEnum = pgEnum("product_status", ["active", "archived"]);

export type ProductStatus = (typeof productStatusEnum.enumValues)[number];

export const recurringPeriodEnum = pgEnum("recurring_period", ["day", "week", "month", "year"]);

export type RecurringPeriod = (typeof recurringPeriodEnum.enumValues)[number];

export const productTypeEnum = pgEnum("product_type", ["subscription", "one_time", "metered"]);

export type ProductType = (typeof productTypeEnum.enumValues)[number];

export const products = pgTable("product", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  images: text("images").array(),
  status: productStatusEnum("status").notNull(),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  type: productTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  environment: networkEnum("network").notNull(),
  priceAmount: integer("price_amount").notNull(),
  recurringPeriod: recurringPeriodEnum("recurring_period"),

  // Metered billing
  unit: text("unit"), // e.g., "tokens", "MB", "requests", "images", "minutes"
  unitDivisor: integer("unit_divisor"), // HOW to convert bytes → units (null = use file count)
  unitsPerCredit: integer("units_per_credit").default(1), // if 1, 1 unit = 1 credit, if 10, 10 units = 1 credit
  creditsGranted: integer("credits_granted"),
  creditExpiryDays: integer("credit_expiry_days"),
});

export const checkoutStatusEnum = pgEnum("checkout_status", checkoutStatus);

export const checkouts = pgTable(
  "checkout",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    customerId: text("customer_id").references(() => customers.id),
    productId: text("product_id").references(() => products.id),
    amount: integer("amount"),
    description: text("description"),
    status: checkoutStatusEnum("status").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    environment: networkEnum("network").notNull(),
    successUrl: text("success_url"),
    successMessage: text("success_message"),
  },
  (table) => ({
    amountOrProductCheck: check(
      "amount_or_product_check",
      sql`${table.productId} IS NOT NULL OR ${table.amount} IS NOT NULL`
    ),
    successUrlOrMessageCheck: check(
      "success_url_or_message_check",
      sql`${table.successUrl} IS NOT NULL OR ${table.successMessage} IS NOT NULL`
    ),
  })
);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "paused",
]);

export const subscriptions = pgTable("subscription", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  status: subscriptionStatusEnum("status").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  pausedAt: timestamp("paused_at"),
  lastPaymentId: text("last_payment_id"),
  nextBillingDate: timestamp("next_billing_date"),
  failedPaymentCount: integer("failed_payment_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  environment: networkEnum("network").notNull(),
});

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "confirmed", "failed"]);

export const payments = pgTable("payment", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  checkoutId: text("checkout_id").references(() => checkouts.id),
  customerId: text("customer_id").references(() => customers.id),
  amount: integer("amount").notNull(),
  transactionHash: text("tx_hash").notNull().unique(),
  status: paymentStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  environment: networkEnum("network").notNull(),
});

export const payoutStatusEnum = pgEnum("payout_status", payoutStatusEnum$1);

export const payouts = pgTable("payout", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  amount: integer("amount").notNull(),
  status: payoutStatusEnum("status").notNull(),
  walletAddress: text("wallet_address").notNull(),
  memo: text("memo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  environment: networkEnum("network").notNull(),
  transactionHash: text("transaction_hash").notNull().unique(),
});

export const webhooks = pgTable("webhook", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").array().$type<Array<WebhookEvent>>().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isDisabled: boolean("is_disabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  environment: networkEnum("network").notNull(),
});

export const webhookLogs = pgTable("webhook_log", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id")
    .notNull()
    .references(() => webhooks.id),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  eventType: text("event_type").notNull(),
  request: jsonb("request").$type<Record<string, unknown>>().notNull(),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  responseTime: integer("response_time"), // in milliseconds
  response: jsonb("response").$type<Record<string, unknown> | null>(),
  apiVersion: text("api_version").notNull(),
  environment: networkEnum("network").notNull(),
  nextRetry: timestamp("next_retry"),
  description: text("description").notNull(),
});

export const refundStatusEnum = pgEnum("refund_status", ["pending", "succeeded", "failed"]);

export const refunds = pgTable(
  "refund",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    paymentId: text("payment_id")
      .notNull()
      .references(() => payments.id),
    customerId: text("customer_id").references(() => customers.id),
    amount: integer("amount").notNull(),
    reason: text("reason"),
    status: refundStatusEnum("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    environment: networkEnum("network").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    receiverPublicKey: text("receiver_public_key").notNull(),
  },
  (table) => ({
    uniquePaymentCustomer: unique().on(table.paymentId, table.customerId),
  })
);

export const creditBalances = pgTable(
  "credit_balance",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    customerId: text("customer_id").references(() => customers.id),
    productId: text("product_id").references(() => products.id),
    environment: networkEnum("network").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    balance: integer("balance").notNull().default(0),
    consumed: integer("consumed").notNull().default(0),
    granted: integer("granted").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    isRevoked: boolean("is_revoked").default(false).notNull(),
  },
  (table) => ({
    // One balance per customer per product
    uniqueCustomerProduct: unique().on(table.customerId, table.productId, table.environment),
    balanceIndex: index("credit_balance_customer_idx").on(table.customerId, table.organizationId),
  })
);

export const creditTransactionTypeEnum = pgEnum("credit_transaction_type", [
  "deduct",
  "refund",
  "grant",
]);

export const creditTransactions = pgTable(
  "credit_transaction",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    customerId: text("customer_id").references(() => customers.id),
    productId: text("product_id").references(() => products.id),
    balanceId: text("balance_id")
      .notNull()
      .references(() => creditBalances.id),
    amount: integer("amount").notNull(),
    balanceBefore: integer("balance_before").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    reason: text("reason"),
    type: creditTransactionTypeEnum("type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    customerIdx: index("credit_tx_customer_idx").on(table.customerId, table.productId),
    balanceIdx: index("credit_tx_balance_idx").on(table.balanceId),
    createdAtIdx: index("credit_tx_created_at_idx").on(table.createdAt),
  })
);

export const passwordReset = pgTable(
  "password_reset",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenIndex: index("password_reset_token_idx").on(table.token),
  })
);

export const eventTypeEnum = pgEnum("event_type", eventTypeEnum$1);
export const events = pgTable("event", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  environment: networkEnum("network").notNull(),
  type: eventTypeEnum("type").notNull(),

  customerId: text("customer_id").references(() => customers.id), // for end users
  merchantId: text("merchant_id").references(() => organizations.id), // for merchants

  // Payload for the timeline UI (e.g., { "amount": 50, "currency": "USD" })
  data: jsonb("data").$type<Record<string, unknown>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Account = InferSelectModel<typeof accounts>;
export type Organization = InferSelectModel<typeof organizations>;
export type TeamMember = InferSelectModel<typeof teamMembers>;
export type ApiKey = InferSelectModel<typeof apiKeys>;
export type Asset = InferSelectModel<typeof assets>;
export type Customer = InferSelectModel<typeof customers>;
export type Product = InferSelectModel<typeof products>;
export type Checkout = InferSelectModel<typeof checkouts>;
export type Payment = InferSelectModel<typeof payments>;
export type Webhook = InferSelectModel<typeof webhooks>;
export type WebhookLog = InferSelectModel<typeof webhookLogs>;
export type Network = (typeof networkEnum.enumValues)[number];
export type TeamInvite = InferSelectModel<typeof teamInvites>;
export type Refund = InferSelectModel<typeof refunds>;
export type CreditBalance = InferSelectModel<typeof creditBalances>;
export type CreditTransaction = InferSelectModel<typeof creditTransactions>;
export type Subscription = InferSelectModel<typeof subscriptions>;
export type Auth = InferSelectModel<typeof auth>;
export type PasswordReset = InferSelectModel<typeof passwordReset>;
export type SecretAccessLog = InferSelectModel<typeof secretAccessLog>;
export type OrganizationSecret = InferSelectModel<typeof organizationSecrets>;
export type Payout = InferSelectModel<typeof payouts>;
export type Event = InferSelectModel<typeof events>;
export type Waitlist = InferSelectModel<typeof waitlist>;
