import { listSubscriptions } from "@/actions/subscription";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { query: Schema.object({ customerId: Schema.string() }) },
  handler: async ({ query: { customerId }, auth: { environment } }) => {
    return await listSubscriptions(customerId, environment).then(Result.ok);
  },
});
