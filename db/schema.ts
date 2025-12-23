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

export const networkEnum = pgEnum("network", ["testnet", "mainnet"]);

export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  userName: text("user_name").notNull(),
  profile: jsonb("profile").$type<{
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  }>(),
  phoneNumber: text("phone_number"),
  sso: jsonb("sso").$type<{
    values: Array<{ provider: string; sub: string }>;
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<object>().default({}),
});

export const organizations = pgTable("organization", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  name: text("name").notNull(),
  description: text("description"),
  ownerAccountId: text("owner_account_id")
    .notNull()
    .references(() => accounts.id),
  settings: jsonb("settings").$type<object>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<object>().default({}),
  environment: networkEnum("network").notNull(),
  stellarAccounts: jsonb("stellar_account").$type<{
    [K in (typeof networkEnum.enumValues)[number]]: {
      public_key: string;
      secret_key: string;
    };
  }>(),
});

export const roleEnum = pgEnum("role", [
  "owner",
  "admin",
  "developer",
  "viewer",
]);

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
    metadata: jsonb("metadata").$type<object>().default({}),
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
  metadata: jsonb("metadata").$type<object>().default({}),
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
  metadata: jsonb("metadata").$type<object>().default({}),
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
    metadata: jsonb("metadata").$type<object>().default({}),
  },
  (table) => ({
    uniqueCodeIssuerNetwork: unique().on(
      table.code,
      table.issuer,
      table.network
    ),
  })
);

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
    appMetadata: jsonb("app_metadata").$type<object>().default({}),
    internalMetadata: jsonb("internal_metadata").$type<object>().default({}),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    environment: networkEnum("network").notNull(),
  },
  (table) => ({
    uniqueOrgEmail: unique().on(table.organizationId, table.email),
  })
);

export const billingTypeEnum = pgEnum("billing_type", [
  "one_time",
  "recurring",
  "metered",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "archived",
]);

export const products = pgTable("product", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  images: text("images").array(),
  phoneNumberRequired: boolean("phone_number_required")
    .default(false)
    .notNull(),
  status: productStatusEnum("status").notNull(),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  billingType: billingTypeEnum("billing_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata").$type<object>().default({}),
  environment: networkEnum("network").notNull(),

  // Metered billing
  unit: text("unit"), // e.g., "tokens", "MB", "requests", "images", "minutes"
  unitsPerCredit: integer("units_per_credit").default(1), // if 1, 1 unit = 1 credit, if 10, 10 units = 1 credit
  creditsGranted: integer("credits_granted"),
  creditExpiryDays: integer("credit_expiry_days"),
});

export const checkoutStatusEnum = pgEnum("checkout_status", [
  "open",
  "completed",
  "expired",
  "failed",
]);

export const checkouts = pgTable(
  "checkout",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    apiKeyId: text("api_key_id").references(() => apiKeys.id),
    customerId: text("customer_id").references(() => customers.id),
    productId: text("product_id").references(() => products.id),
    amount: integer("amount"),
    description: text("description"),
    status: checkoutStatusEnum("status").notNull(),
    paymentUrl: text("payment_url").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: jsonb("metadata").$type<object>().default({}),
    environment: networkEnum("network").notNull(),
  },
  (table) => ({
    amountOrProductCheck: check(
      "amount_or_product_check",
      sql`${table.productId} IS NOT NULL OR ${table.amount} IS NOT NULL`
    ),
  })
);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "failed",
]);

export const payments = pgTable("payment", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  checkoutId: text("checkout_id").references(() => checkouts.id),
  customerId: text("customer_id").references(() => customers.id),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.id),
  amount: integer("amount").notNull(),
  transactionHash: text("tx_hash").notNull().unique(),
  status: paymentStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  environment: networkEnum("network").notNull(),
});

export const featureEnum = pgEnum("feature", ["aisdk", "uploadthing"]);

export const usageRecords = pgTable(
  "usage_record",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id),
    apiKeyId: text("api_key_id")
      .notNull()
      .references(() => apiKeys.id),
    customerId: text("customer_id").references(() => customers.id),
    feature: featureEnum("feature").notNull(),
    quantity: integer("quantity").notNull(), // Number of units consumed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    metadata: jsonb("metadata").$type<object>().default({}),
    environment: networkEnum("network").notNull(),
    aisdk: jsonb("aisdk"),
  },
  (table) => ({
    orgFeatureCreatedIdx: index("usage_records_org_feature_created_idx").on(
      table.organizationId,
      table.feature,
      table.createdAt
    ),
  })
);

export type WebhookEvent = [
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "checkout.created",
  "payment.pending",
  "payment.confirmed",
  "payment.failed",
  "refund.created",
  "refund.succeeded",
  "refund.failed",
];

export const webhooks = pgTable("webhook", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: text("events").array().notNull(),
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
  payload: jsonb("payload").$type<object>().notNull(),
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  environment: networkEnum("network").notNull(),
});

export const refundStatusEnum = pgEnum("refund_status", [
  "pending",
  "succeeded",
  "failed",
]);

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
    assetId: text("asset_id").references(() => assets.id),
    amount: integer("amount").notNull(),
    transactionHash: text("tx_hash").notNull().unique(),
    reason: text("reason"),
    status: refundStatusEnum("status").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    environment: networkEnum("network").notNull(),
    metadata: jsonb("metadata").$type<object>().default({}),
    receiverPublicKey: text("receiver_public_key").notNull(),
  },
  (table) => ({
    uniquePaymentCustomerAsset: unique().on(
      table.paymentId,
      table.customerId,
      table.assetId
    ),
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
    metadata: jsonb("metadata").$type<object>(),
    balance: integer("balance").notNull().default(0),
    consumed: integer("consumed").notNull().default(0),
    granted: integer("granted").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // One balance per customer per product
    uniqueCustomerProduct: unique().on(
      table.customerId,
      table.productId,
      table.environment
    ),
    balanceIndex: index("credit_balance_customer_idx").on(
      table.customerId,
      table.organizationId
    ),
  })
);

export type Account = InferSelectModel<typeof accounts>;
export type Organization = InferSelectModel<typeof organizations>;
export type TeamMember = InferSelectModel<typeof teamMembers>;
export type ApiKey = InferSelectModel<typeof apiKeys>;
export type Asset = InferSelectModel<typeof assets>;
export type Customer = InferSelectModel<typeof customers>;
export type Product = InferSelectModel<typeof products>;
export type Checkout = InferSelectModel<typeof checkouts>;
export type Payment = InferSelectModel<typeof payments>;
export type UsageRecord = InferSelectModel<typeof usageRecords>;
export type Webhook = InferSelectModel<typeof webhooks>;
export type WebhookLog = InferSelectModel<typeof webhookLogs>;
export type Network = (typeof networkEnum.enumValues)[number];
export type TeamInvite = InferSelectModel<typeof teamInvites>;
export type Refund = InferSelectModel<typeof refunds>;
export type CreditBalance = InferSelectModel<typeof creditBalances>;
