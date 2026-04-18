import { Result, z as Schema, updateSubscriptionSchema } from "@stellartools/core";
import { putSubscription, retrieveCustomerWallets, retrieveSubscription, runAtomic } from "@stellartools/web/actions";
import { Subscription } from "@stellartools/web/db";
import {
  cancelSubscription as cancelSorobanSubscription,
  retrieveSubscription as retrieveSorobanSubscription,
} from "@stellartools/web/integrations";
import { apiHandler, computeDiff, createOptionsHandler, toSnakeCase } from "@stellartools/web/lib";
import { all } from "better-all";
import _ from "lodash";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session", "apikey", "portal"],
  schema: { params: Schema.object({ id: Schema.string() }) },
  handler: async ({ params: { id }, auth: { organizationId, environment } }) => {
    const { subscription, customerWallet } = await all({
      subscription: async () => retrieveSubscription(id, organizationId, environment),
      async customerWallet() {
        const subscription = await this.$.subscription;
        return await retrieveCustomerWallets(
          subscription.customerId,
          { id: subscription.customerWalletId },
          organizationId,
          environment
        ).then(([w]) => w ?? null);
      },
    });

    if (!customerWallet?.address) {
      return Result.err(new Error("Customer wallet not found"));
    }

    const onchainSubscription = await retrieveSorobanSubscription(
      environment,
      customerWallet.address,
      subscription.productId
    );

    if (onchainSubscription.isErr()) return Result.err(onchainSubscription.error);

    const chainStateAsDb = {
      status: onchainSubscription.value.status,
      amount: Number(onchainSubscription.value.amount),
      currentPeriodEnd: new Date(Number(onchainSubscription.value.periodEnd) * 1000),
    };

    const dbComparisonState = _.pick(subscription, Object.keys(chainStateAsDb));
    const diff = computeDiff(dbComparisonState, chainStateAsDb);

    let updatedSubscription: Subscription | null = subscription;

    if (diff) {
      await runAtomic(async () => {
        const updated = await putSubscription(id, chainStateAsDb, organizationId, environment);
        updatedSubscription = updated;
      });
    }

    if (!updatedSubscription) return Result.err(new Error("Subscription not found"));

    return Result.ok(
      toSnakeCase({
        id: updatedSubscription.id,
        customerId: updatedSubscription.customerId,
        productId: updatedSubscription.productId,
        status: updatedSubscription.status,
        currentPeriodStart: updatedSubscription.currentPeriodStart,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        metadata: updatedSubscription.metadata,
        trialDays: updatedSubscription.trialDays,
        updatedAt: updatedSubscription.updatedAt,
        createdAt: updatedSubscription.createdAt,
      })
    );
  },
});

export const PUT = apiHandler({
  auth: ["session", "apikey", "portal"],
  schema: { body: updateSubscriptionSchema, params: Schema.object({ id: Schema.string() }) },
  handler: async ({
    body: { metadata, cancelAtPeriodEnd, productId },
    params: { id },
    auth: { organizationId, environment },
  }) => {
    const { subscription, customerWallet } = await all({
      subscription: async () => retrieveSubscription(id, organizationId, environment),
      async customerWallet() {
        const subscription = await this.$.subscription;
        return await retrieveCustomerWallets(
          subscription.customerId,
          { id: subscription.customerWalletId },
          organizationId,
          environment
        ).then(([w]) => w ?? null);
      },
    });

    if (!customerWallet?.address) return Result.err(new Error("Customer wallet not found"));

    let cancellationResult: Awaited<ReturnType<typeof cancelSorobanSubscription>> | null = null;

    if (cancelAtPeriodEnd) {
      cancellationResult = await cancelSorobanSubscription(
        environment,
        customerWallet.address,
        subscription.customerId,
        subscription.productId
      );
    }

    if (cancellationResult?.isErr()) return Result.err(cancellationResult.error);

    const updatedSubscription = await putSubscription(
      id,
      {
        ...(cancelAtPeriodEnd && { cancelAtPeriodEnd }),
        ...(metadata && { metadata: { ...(subscription.metadata ?? {}), ...metadata } }),
        ...(productId && { productId }),
      },
      organizationId,
      environment
    );

    return Result.ok(updatedSubscription);
  },
});
