ALTER TABLE "api_key" RENAME COLUMN "key_hash" TO "token";--> statement-breakpoint
ALTER TABLE "api_key" DROP CONSTRAINT "api_key_key_hash_unique";--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_token_unique" UNIQUE("token");