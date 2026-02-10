CREATE TYPE "public"."account_billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TABLE "plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"billing_events" integer NOT NULL,
	"customers" integer NOT NULL,
	"subscriptions" integer NOT NULL,
	"usage_records" integer NOT NULL,
	"payments" integer NOT NULL,
	"organizations" integer DEFAULT 1 NOT NULL,
	"custom" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "billing_cycle" "account_billing_cycle";--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "plan_id" text;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_plan_id_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;