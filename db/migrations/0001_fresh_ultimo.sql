ALTER TABLE "organization" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "social_links" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "customer" DROP COLUMN "internal_metadata";--> statement-breakpoint
DROP TYPE "public"."feature";