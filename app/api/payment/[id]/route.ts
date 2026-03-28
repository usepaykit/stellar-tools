import { refreshTxStatus, retrievePayments } from "@/actions/payment";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });

export const GET = apiHandler({
  auth: ["session", "apikey"],
  schema: { params: paramsSchema, body: Schema.object({ verifyOnChain: Schema.boolean().optional().default(false) }) },
  handler: async ({ params: { id }, body: { verifyOnChain }, auth: { organizationId, environment } }) => {
    const [payment] = await retrievePayments(
      organizationId,
      environment,
      { paymentId: id },
      { withCustomer: true, withWallets: true }
    );

    const { customer, wallets, refunds: _refunds, asset: _asset, ...rest } = payment;

    if (verifyOnChain && payment.status === "pending") {
      await refreshTxStatus(id, payment.transactionHash, organizationId, environment);
    }
    return Result.ok({
      ...rest,
      line_items: [{ amount: `${payment.amount} ${payment.asset?.code}`, customer, wallets, refunds: _refunds }],
    });
  },
});
