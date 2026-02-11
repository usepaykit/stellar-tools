ALTER TYPE "public"."subscription_status" ADD VALUE 'trialing';--> statement-breakpoint
ALTER TABLE "checkout" ADD COLUMN "asset" text;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_asset_asset_id_fk" FOREIGN KEY ("asset") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;