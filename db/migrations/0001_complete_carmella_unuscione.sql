ALTER TABLE "event" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."event_type";--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('customer::created', 'customer::updated', 'payment::completed', 'payment::failed', 'payout::requested', 'payout::processed', 'checkout::created', 'checkout::updated', 'refund::created', 'refund::failed', 'subscription::created', 'subscription::updated', 'subscription::deleted', 'subscription::canceled', 'payment_method::created', 'payment_method::deleted', 'customer_portal_session::created');--> statement-breakpoint
ALTER TABLE "event" ALTER COLUMN "type" SET DATA TYPE "public"."event_type" USING "type"::"public"."event_type";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'paused');