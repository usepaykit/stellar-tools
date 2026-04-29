import { sweepAndProcessPayment } from "@/actions/payment";
import { apiHandler } from "@/lib/api-handler";
import { Result } from "@stellartools/core";

export const GET = apiHandler({
  auth: ["apikey"],
  handler: async ({ auth: { organizationId, environment } }) => {
    const checkoutId = "cz_EFA8OjVvpdIm3ZqaAcgK9o2E";
    await sweepAndProcessPayment(checkoutId);
    return Result.ok("Payment processed");
  },
});
