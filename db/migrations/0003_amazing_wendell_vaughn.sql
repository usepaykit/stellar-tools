CREATE TYPE "public"."event_type" AS ENUM('customer::created', 'customer::updated', 'payment::completed', 'payment::failed', 'payout::requested', 'payout::processed', 'checkout::created', 'checkout::updated');--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"network" "network" NOT NULL,
	"type" "event_type" NOT NULL,
	"customer_id" text,
	"merchant_id" text,
	"data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_merchant_id_organization_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;