ALTER TYPE "public"."event_type" ADD VALUE 'subscription::canceled';--> statement-breakpoint
CREATE TABLE "customer_portal_session" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"customer_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"network" "network" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_portal_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "customer_portal_session" ADD CONSTRAINT "customer_portal_session_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_portal_session" ADD CONSTRAINT "customer_portal_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_portal_session_token_idx" ON "customer_portal_session" USING btree ("token");