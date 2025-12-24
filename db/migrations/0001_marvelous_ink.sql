CREATE TYPE "public"."recurring_period" AS ENUM('day', 'week', 'month', 'year');--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "price_amount" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "recurring_period" "recurring_period";--> statement-breakpoint
ALTER TABLE "webhook_log" ADD COLUMN "response_time" integer;