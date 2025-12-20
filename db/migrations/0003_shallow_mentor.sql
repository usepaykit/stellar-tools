ALTER TABLE "accounts" RENAME TO "account";--> statement-breakpoint
ALTER TABLE "api_keys" RENAME TO "api_key";--> statement-breakpoint
ALTER TABLE "assets" RENAME TO "asset";--> statement-breakpoint
ALTER TABLE "checkouts" RENAME TO "checkout";--> statement-breakpoint
ALTER TABLE "customers" RENAME TO "customer";--> statement-breakpoint
ALTER TABLE "organizations" RENAME TO "organization";--> statement-breakpoint
ALTER TABLE "payments" RENAME TO "payment";--> statement-breakpoint
ALTER TABLE "products" RENAME TO "product";--> statement-breakpoint
ALTER TABLE "team_members" RENAME TO "team_member";--> statement-breakpoint
ALTER TABLE "usage_records" RENAME TO "usage_record";--> statement-breakpoint
ALTER TABLE "webhook_logs" RENAME TO "webhook_log";--> statement-breakpoint
ALTER TABLE "webhooks" RENAME TO "webhook";--> statement-breakpoint
ALTER TABLE "account" DROP CONSTRAINT "accounts_email_unique";--> statement-breakpoint
ALTER TABLE "api_key" DROP CONSTRAINT "api_keys_key_hash_unique";--> statement-breakpoint
ALTER TABLE "asset" DROP CONSTRAINT "assets_code_issuer_network_unique";--> statement-breakpoint
ALTER TABLE "customer" DROP CONSTRAINT "customers_organization_id_email_unique";--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payments_tx_hash_unique";--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "team_members_organization_id_account_id_unique";--> statement-breakpoint
ALTER TABLE "api_key" DROP CONSTRAINT "api_keys_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkouts_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkouts_api_key_id_api_keys_id_fk";
--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkouts_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "customer" DROP CONSTRAINT "customers_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "organization" DROP CONSTRAINT "organizations_owner_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payments_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payments_checkout_id_checkouts_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payments_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "payment" DROP CONSTRAINT "payments_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "products_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "products_asset_id_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "team_members_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "team_member" DROP CONSTRAINT "team_members_account_id_accounts_id_fk";
--> statement-breakpoint
ALTER TABLE "usage_record" DROP CONSTRAINT "usage_records_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "usage_record" DROP CONSTRAINT "usage_records_api_key_id_api_keys_id_fk";
--> statement-breakpoint
ALTER TABLE "usage_record" DROP CONSTRAINT "usage_records_customer_id_customers_id_fk";
--> statement-breakpoint
ALTER TABLE "webhook_log" DROP CONSTRAINT "webhook_logs_webhook_id_webhooks_id_fk";
--> statement-breakpoint
ALTER TABLE "webhook" DROP CONSTRAINT "webhooks_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_api_key_id_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_owner_account_id_account_id_fk" FOREIGN KEY ("owner_account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_checkout_id_checkout_id_fk" FOREIGN KEY ("checkout_id") REFERENCES "public"."checkout"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_asset_id_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."asset"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_api_key_id_api_key_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_key"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_record" ADD CONSTRAINT "usage_record_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_log" ADD CONSTRAINT "webhook_log_webhook_id_webhook_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhook"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook" ADD CONSTRAINT "webhook_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_key_hash_unique" UNIQUE("key_hash");--> statement-breakpoint
ALTER TABLE "asset" ADD CONSTRAINT "asset_code_issuer_network_unique" UNIQUE("code","issuer","network");--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_organization_id_email_unique" UNIQUE("organization_id","email");--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_tx_hash_unique" UNIQUE("tx_hash");--> statement-breakpoint
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_organization_id_account_id_unique" UNIQUE("organization_id","account_id");