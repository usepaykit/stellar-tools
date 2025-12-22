ALTER TABLE "webhook" RENAME COLUMN "secret_hash" TO "secret";--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkout_asset_id_asset_id_fk";
--> statement-breakpoint
ALTER TABLE "refund" ADD COLUMN "receiver_public_key" text NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout" DROP COLUMN "asset_id";--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_customer_id_asset_id_unique" UNIQUE("payment_id","customer_id","asset_id");