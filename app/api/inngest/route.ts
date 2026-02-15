import { CronJobApi } from "@/integrations/cron-job";
import { serve } from "inngest/next";

export const cronJobApi = new CronJobApi();

export const inngestServe = serve({
  client: cronJobApi.getClient(),
  functions: cronJobApi.getFunctions(),
  //   signingKey: process.env.INNGEST_SIGNING_KEY,
});

export const { GET, POST, PUT } = inngestServe;
