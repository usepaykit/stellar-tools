CREATE TYPE "public"."charge_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."charge_type" AS ENUM('platform_fee', 'payout_fee');--> statement-breakpoint
CREATE TABLE "charge" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"payment_id" text,
	"amount" bigint NOT NULL,
	"amount_usd" integer NOT NULL,
	"asset_id" text NOT NULL,
	"type" charge_type NOT NULL,
	"status" charge_status NOT NULL,
	"tx_hash" text,
	"error" text,
	"network" "network" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment" ALTER COLUMN "amount" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_payment_id_payment_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "platform_fee_usd";--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "org_monthly_volume_usd";