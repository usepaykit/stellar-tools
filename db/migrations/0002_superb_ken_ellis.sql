CREATE TABLE "customer_wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"address" text NOT NULL,
	"name" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"metadata" jsonb,
	CONSTRAINT "customer_wallet_customer_id_address_unique" UNIQUE("customer_id","address")
);
--> statement-breakpoint
-- DROP TYPE "public"."product_type";--> statement-breakpoint
-- CREATE TYPE "public"."product_type" AS ENUM('one_time', 'subscription', 'metered');--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "wallet_id" text;--> statement-breakpoint
ALTER TABLE "customer_wallet" ADD CONSTRAINT "customer_wallet_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_wallet_id_customer_wallet_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."customer_wallet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "wallet_addresses";--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_phone_unique" UNIQUE("organization_id","phone");