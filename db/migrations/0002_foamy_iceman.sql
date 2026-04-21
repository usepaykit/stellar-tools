ALTER TABLE "event" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('customer::created', 'customer::updated', 'payment::completed', 'payment::failed', 'checkout::created', 'checkout::updated', 'subscription::created', 'subscription::updated', 'subscription::deleted', 'subscription::canceled', 'refund::created', 'refund::failed', 'payout::requested', 'payout::processed', 'payment_method::created', 'payment_method::deleted', 'customer_portal_session::created');--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "type" SET DATA TYPE "public"."event_type" USING "type"::"public"."event_type";--> statement-breakpoint
ALTER TABLE "webhook_log" ALTER COLUMN "organization_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app" ADD COLUMN "manifest" jsonb;--> statement-breakpoint
ALTER TABLE "webhook_log" ADD COLUMN "app_installation_id" text;--> statement-breakpoint
ALTER TABLE "webhook_log" ADD CONSTRAINT "webhook_log_app_installation_id_app_installation_id_fk" FOREIGN KEY ("app_installation_id") REFERENCES "public"."app_installation"("id") ON DELETE no action ON UPDATE no action;