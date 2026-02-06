ALTER TABLE "waitlist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "waitlist" CASCADE;--> statement-breakpoint
ALTER TABLE "organization_secret" ALTER COLUMN "testnet_secret_encrypted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_secret" ALTER COLUMN "testnet_public_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "credit_transaction" ADD COLUMN "network" "network" NOT NULL;