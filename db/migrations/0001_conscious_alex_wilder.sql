ALTER TABLE "api_keys" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "checkouts" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "stellar_accounts" ADD COLUMN "secret_key" text;--> statement-breakpoint
ALTER TABLE "usage_records" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_logs" ADD COLUMN "network" "network" NOT NULL;--> statement-breakpoint
ALTER TABLE "webhooks" ADD COLUMN "network" "network" NOT NULL;