import { putPayment, retrievePayments } from "@/actions/payment";
import { retrieveTransaction } from "@/integrations/stellar-core";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { toSnakeCase } from "@/lib/utils";
import { Result, z as Schema } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

const paramsSchema = Schema.object({ id: Schema.string() });

export const GET = apiHandler({
  auth: ["session", "apikey", "app"],
  requiredAppScope: "read:payments",
  schema: { params: paramsSchema },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    let [payment] = await retrievePayments(
      organizationId,
      environment,
      { paymentId: id },
      { withCustomer: true, withWallets: true, withRefunds: true }
    );

    const { customer, wallets, refunds, asset: _asset, ...rest } = payment;

    if (payment.status === "pending") {
      const txResult = await retrieveTransaction(payment.transactionHash, environment);

      if (txResult.isErr()) throw new Error(txResult.error?.message);

      if (txResult.value?.successful) {
        await putPayment(payment.id, organizationId, environment, { status: "confirmed" });
      } else {
        await putPayment(payment.id, organizationId, environment, { status: "failed" });
      }

      [payment] = await retrievePayments(
        organizationId,
        environment,
        { paymentId: id },
        { withCustomer: true, withWallets: true, withRefunds: true }
      );
    }

    return Result.ok(
      toSnakeCase({
        id: rest.id,
        checkoutId: rest.checkoutId,
        createdAt: rest.createdAt,
        metadata: rest.metadata,
        status: rest.status,
        transactionHash: rest.transactionHash,
        subscriptionId: rest.subscriptionId,
        customerId: rest.customerId,
        amount: `${payment.amount} ${payment.asset?.code}`,
        line_items: [
          {
            customer: {
              id: customer?.id,
              email: customer?.email,
              name: customer?.name,
              metadata: customer?.metadata,
              createdAt: customer?.createdAt,
            },
            wallet: {
              id: wallets?.id,
              address: wallets?.address,
              metadata: wallets?.metadata,
            },
            refund: refunds
              ? {
                  id: refunds?.id,
                  status: refunds?.status,
                  receiverAddress: refunds?.receiverWalletAddress,
                  reason: refunds?.reason,
                  amount: `${refunds?.amount} ${refunds?.assetCode}`,
                }
              : null,
          },
        ],
      })
    );
  },
});
