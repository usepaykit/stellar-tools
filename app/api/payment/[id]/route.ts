import { refreshTxStatus, retrievePayment } from "@/actions/payment";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });

export const GET = apiHandler({
  auth: true,
  schema: { params: paramsSchema, body: Schema.object({ verifyOnChain: Schema.boolean().optional().default(false) }) },
  handler: async ({ params: { id }, body: { verifyOnChain }, auth: { organizationId, environment } }) => {
    const payment = await retrievePayment(id, organizationId, environment);
    if (verifyOnChain && payment.status === "pending") {
      await refreshTxStatus(id, payment.transactionHash, organizationId, environment);
    }
    return Result.ok(payment);
  },
});
