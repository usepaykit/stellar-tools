ALTER TABLE "waitlist" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "waitlist" CASCADE;--> statement-breakpoint
ALTER TABLE "organization_secret" ALTER COLUMN "testnet_secret_encrypted" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_secret" ALTER COLUMN "testnet_public_key" DROP NOT NULL;--> statement-breakpoint
-- Step 1: Add the column as nullable
ALTER TABLE "credit_transaction" ADD COLUMN "network" "network";

-- Step 2: Backfill existing rows (replace 'your_default_value' with an appropriate value)
UPDATE "credit_transaction" SET "network" = 'your_default_value' WHERE "network" IS NULL;

-- Step 3: Set the column as NOT NULL
ALTER TABLE "credit_transaction" ALTER COLUMN "network" SET NOT NULL;