ALTER TYPE "public"."event_type" ADD VALUE 'refund::failed' BEFORE 'subscription::created';--> statement-breakpoint
ALTER TABLE "refund" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."refund_status";--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('succeeded', 'failed');--> statement-breakpoint
ALTER TABLE "refund" ALTER COLUMN "status" SET DATA TYPE "public"."refund_status" USING "status"::"public"."refund_status";--> statement-breakpoint
ALTER TABLE "payout" ALTER COLUMN "wallet_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payout" ALTER COLUMN "transaction_hash" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payout" ADD COLUMN "stringified_bank_account" text;--> statement-breakpoint
ALTER TABLE "payout" ADD COLUMN "withdrawal_receipt_url" text;--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "asset_code" text;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "asset_or_stringified_bank_account_check" CHECK ("payout"."asset" IS NOT NULL OR "payout"."stringified_bank_account" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "transaction_hash_or_withdrawal_receipt_url_check" CHECK ("payout"."transaction_hash" IS NOT NULL OR "payout"."withdrawal_receipt_url" IS NOT NULL);