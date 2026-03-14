ALTER TABLE "checkout" RENAME COLUMN "asset" TO "asset_code";--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkout_asset_asset_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "customer_wallet" DROP COLUMN "is_default";