DROP INDEX "idx_org_env";--> statement-breakpoint
ALTER TABLE "checkout" ADD COLUMN "internal_plan_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "plan" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "plan" ADD COLUMN "amount_usd_cents" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_internal_plan_id_plan_id_fk" FOREIGN KEY ("internal_plan_id") REFERENCES "public"."plan"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_customer_org_env" ON "customer" USING btree ("organization_id","network");--> statement-breakpoint
CREATE INDEX "idx_customer_org_created_at" ON "customer" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_org_created_at" ON "organization" USING btree ("account_id","created_at");