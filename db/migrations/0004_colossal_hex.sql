ALTER TABLE "checkout" RENAME COLUMN "success_url" TO "redirect_url";--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "success_url_or_message_check";--> statement-breakpoint
ALTER TABLE "checkout" DROP COLUMN "success_message";