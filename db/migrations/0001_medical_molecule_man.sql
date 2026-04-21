CREATE TYPE "public"."app_installation_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TABLE "app_installation" (
	"id" text PRIMARY KEY NOT NULL,
	"app_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"network" "network" NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"scopes" text[] NOT NULL,
	"status" "app_installation_status" NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "app_installation_app_id_organization_id_network_unique" UNIQUE("app_id","organization_id","network")
);
--> statement-breakpoint
CREATE TABLE "app_log" (
	"id" text PRIMARY KEY NOT NULL,
	"installation_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"action" text NOT NULL,
	"status_code" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"base_url" text NOT NULL,
	"app_secret" text NOT NULL,
	"webhook_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"publisher" text NOT NULL,
	"features_markdown" text NOT NULL,
	"price" text,
	"tagline" text NOT NULL,
	"website_url" text,
	"support_email" text,
	CONSTRAINT "app_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "app_installation" ADD CONSTRAINT "app_installation_app_id_app_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."app"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_installation" ADD CONSTRAINT "app_installation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_log" ADD CONSTRAINT "app_log_installation_id_app_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."app_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_log" ADD CONSTRAINT "app_log_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_app_inst_org_env" ON "app_installation" USING btree ("organization_id","network");