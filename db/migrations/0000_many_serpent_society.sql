CREATE TYPE "public"."asset_code" AS ENUM('XLM', 'USDC');--> statement-breakpoint
CREATE TYPE "public"."billing_type" AS ENUM('one_time', 'recurring', 'metered');--> statement-breakpoint
CREATE TYPE "public"."checkout_status" AS ENUM('open', 'completed', 'expired', 'failed');--> statement-breakpoint
CREATE TYPE "public"."network" AS ENUM('testnet', 'mainnet');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('owner', 'admin', 'developer', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."stellar_account_type" AS ENUM('custodial', 'external');--> statement-breakpoint

CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"user_name" text NOT NULL,
	"profile" jsonb,
	"phone_number" text,
	"sso" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"scope" jsonb NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" text PRIMARY KEY NOT NULL,
	"code" "asset_code" NOT NULL,
	"issuer" text,
	"network" "network" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "assets_code_issuer_network_unique" UNIQUE("code","issuer","network")
);
--> statement-breakpoint
CREATE TABLE "checkouts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"api_key_id" text,
	"customer_id" text,
	"price_id" text NOT NULL,
	"status" "checkout_status" NOT NULL,
	"payment_url" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text,
	"name" text,
	"phone" text,
	"app_metadata" jsonb DEFAULT '{}'::jsonb,
	"internal_metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_organization_id_email_unique" UNIQUE("organization_id","email")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_account_id" text NOT NULL,
	"settings" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"checkout_id" text,
	"customer_id" text,
	"stellar_account_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"amount" integer NOT NULL,
	"transaction_hash" text NOT NULL,
	"status" "payment_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transaction_hash_unique" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"asset_id" text NOT NULL,
	"billing_type" "billing_type" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "stellar_accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"customer_id" text,
	"public_key" text NOT NULL,
	"memo" text,
	"type" "stellar_account_type" NOT NULL,
	"network" "network" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "stellar_accounts_public_key_network_unique" UNIQUE("public_key","network")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"account_id" text NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "team_members_organization_id_account_id_unique" UNIQUE("organization_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"api_key_id" text NOT NULL,
	"customer_id" text,
	"feature" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"webhook_id" text NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status_code" integer,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"events" jsonb NOT NULL,
	"is_disabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_account_id_accounts_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_checkout_id_checkouts_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."checkouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_stellar_account_id_stellar_accounts_id_fk" FOREIGN KEY ("stellar_account_id") REFERENCES "public"."stellar_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stellar_accounts" ADD CONSTRAINT "stellar_accounts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stellar_accounts" ADD CONSTRAINT "stellar_accounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_records_org_feature_created_idx" ON "usage_records" USING btree ("organization_id","feature","created_at");