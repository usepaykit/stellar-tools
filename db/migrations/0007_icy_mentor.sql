ALTER TABLE "charge" RENAME COLUMN "amount_usd" TO "amount_usd_cents";--> statement-breakpoint
ALTER TABLE "payment" RENAME COLUMN "amount_usd_snapshot" TO "amount_usd_cents_snapshot";