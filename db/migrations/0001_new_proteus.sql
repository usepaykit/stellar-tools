ALTER TABLE "plan" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "plan" CASCADE;--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "account_plan_id_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkout_internal_plan_id_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "fee_token" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "platform_fee_usd" integer;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "org_monthly_volume_usd" integer;--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "billing_cycle";--> statement-breakpoint
ALTER TABLE "account" DROP COLUMN "plan_id";--> statement-breakpoint
ALTER TABLE "checkout" DROP COLUMN "internal_plan_id";--> statement-breakpoint
DROP TYPE "public"."account_billing_cycle";