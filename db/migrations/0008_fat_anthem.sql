DROP TABLE "team_invite" CASCADE;--> statement-breakpoint
DROP TABLE "team_member" CASCADE;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "trial_days" integer DEFAULT 0;--> statement-breakpoint
DROP TYPE "public"."role";--> statement-breakpoint
DROP TYPE "public"."team_invite_status";