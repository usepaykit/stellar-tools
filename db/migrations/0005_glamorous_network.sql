ALTER TABLE "plan" ADD COLUMN "products" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_org_env" ON "customer" USING btree ("organization_id","network");