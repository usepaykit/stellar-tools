ALTER TABLE "event" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('customer::created', 'customer::updated', 'payment::completed', 'payment::failed', 'payout::requested', 'payout::processed', 'checkout::created', 'checkout::updated', 'refund::created', 'refund::failed', 'subscription::created', 'subscription::updated', 'subscription::deleted', 'subscription::canceled', 'customer_wallet::linked', 'customer_portal_session::created');--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "type" SET DATA TYPE "public"."event_type" USING "type"::"public"."event_type";--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN "subscription_id" text;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE no action ON UPDATE no action;