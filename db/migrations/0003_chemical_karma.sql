CREATE TYPE "public"."product_type" AS ENUM('subscription', 'one_time', 'metered');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'past_due', 'canceled', 'paused');--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_id" text NOT NULL,
	"product_id" text NOT NULL,
	"status" "subscription_status" NOT NULL,
	"organization_id" text NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp,
	"paused_at" timestamp,
	"last_payment_id" text,
	"next_billing_date" timestamp,
	"failed_payment_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"network" "network" NOT NULL,
	CONSTRAINT "is_subscription_product" CHECK (
      "subscription"."product_id" IS NOT NULL AND "product"."type" = 'subscription'::product_type
    )
);
--> statement-breakpoint
ALTER TABLE "product" RENAME COLUMN "phone_number_required" TO "type";--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "phone_number";