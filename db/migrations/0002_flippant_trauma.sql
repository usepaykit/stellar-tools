ALTER TABLE "stellar_accounts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "stellar_accounts" CASCADE;--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "transaction_hash" TO "tx_hash";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_transaction_hash_unique";--> statement-breakpoint
-- ALTER TABLE "payments" DROP CONSTRAINT "payments_stellar_account_id_stellar_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stellar_account" jsonb;--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "stellar_account_id";--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_tx_hash_unique" UNIQUE("tx_hash");--> statement-breakpoint
DROP TYPE "public"."stellar_account_type";