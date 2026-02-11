ALTER TABLE "plan" RENAME COLUMN "amount_usd_cents" TO "monthly_amount_usd_cents";--> statement-breakpoint
ALTER TABLE "plan" ADD COLUMN "yearly_amount_usd_cents" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "plan" ADD COLUMN "payment_methods" jsonb;--> statement-breakpoint
ALTER TABLE "plan" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "plan" ADD CONSTRAINT "plan_monthly_amount_usd_cents_yearly_amount_usd_cents_unique" UNIQUE("monthly_amount_usd_cents","yearly_amount_usd_cents");