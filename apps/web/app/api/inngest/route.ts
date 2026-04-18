import { CronJobApi } from "@stellartools/web/integrations";
import { serve } from "inngest/next";

const cronJobApi = new CronJobApi();

export const { GET, POST, PUT } = serve({
  client: cronJobApi.getClient(),
  functions: cronJobApi.getFunctions(),
});
