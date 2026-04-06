"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { SubscriptionStatus } from "@/constant/schema.client";
import { Network, Subscription, assets, customerWallets, customers, db, products, subscriptions } from "@/db";
import { computeDiff } from "@/lib/utils";
import { EventTrigger, WebhookTrigger } from "@/types";
import { OverrideProps, Prettify } from "@stellartools/core";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";

export const postSubscriptionsBulk = async (
  params: {
    id: string;
    customerIds: string[];
    productId: string;
    period: { from: string; to: string };
    cancelAtPeriodEnd: boolean;
    metadata: Record<string, unknown> | null;
  },
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return withEvent(
    async () => {
      const values = params.customerIds.map((cid) => ({
        id: params.id,
        customerId: cid,
        productId: params.productId,
        status: "active" as const,
        organizationId,
        environment,
        currentPeriodStart: new Date(params.period.from),
        currentPeriodEnd: new Date(params.period.to),
        cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      }));

      return await db.insert(subscriptions).values(values).returning();
    },
    {
      events: [
        {
          type: "subscription::created",
          map: (subscription) =>
            subscription.map(
              ({ customerId, id, status, productId, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd }) => ({
                customerId,
                subscriptionId: id,
                data: {
                  id,
                  productId,
                  status,
                  currentPeriodStart,
                  currentPeriodEnd,
                  cancelAtPeriodEnd,
                },
              })
            ),
        },
      ],
      webhooks: {
        organizationId,
        environment,
        triggers: [
          {
            event: "subscription.created",
            map: (subscription) =>
              subscription.map(
                ({ id, customerId, productId, status, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd }) => ({
                  id,
                  status,
                  customerId,
                  productId,
                  currentPeriodStart,
                  currentPeriodEnd,
                  cancelAtPeriodEnd,
                })
              ),
          },
        ],
      },
    }
  );
};

export const retrieveSubscription = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment)
      )
    )
    .limit(1);

  if (!subscription) throw new Error("Subscription not found");

  return subscription;
};

type SubscriptionRow<S extends SubscriptionStatus> = {
  subscription: OverrideProps<Subscription, { status: S }>;
  customer: { name: string | null; email: string | null };
  product: { name: string; priceAmount: number };
};

export const retrieveSubscriptions = async <S extends SubscriptionStatus = SubscriptionStatus>(
  orgId?: string,
  env?: Network,
  filters?: { customerId?: string; status?: S }
): Promise<SubscriptionRow<S>[]> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const results = await db
    .select({
      subscription: subscriptions,
      customer: { name: customers.name, email: customers.email },
      product: { name: products.name, priceAmount: products.priceAmount },
    })
    .from(subscriptions)
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(
      and(
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment),
        filters?.customerId ? eq(subscriptions.customerId, filters.customerId) : undefined,
        filters?.status ? eq(subscriptions.status, filters.status) : undefined
      )
    )
    .orderBy(desc(subscriptions.createdAt));

  return results as Prettify<SubscriptionRow<S>[]>;
};

export const listSubscriptions = async (customerId: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const subscriptionList = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment)
      )
    );

  return subscriptionList;
};

export const putSubscription = async (id: string, retUpdate: Partial<Subscription>, orgId?: string, env?: Network) => {
  const [{ organizationId, environment }, oldSubscription] = await Promise.all([
    resolveOrgContext(orgId, env),
    retrieveSubscription(id),
  ]);

  return withEvent(
    async () => {
      const [record] = await db
        .update(subscriptions)
        .set({ ...retUpdate, updatedAt: new Date() })
        .where(
          and(
            eq(subscriptions.id, id),
            eq(subscriptions.organizationId, organizationId),
            eq(subscriptions.environment, environment)
          )
        )
        .returning();

      if (!record) throw new Error("Subscription not found");

      return record;
    },
    (subscription) => {
      let events: EventTrigger<typeof subscription>[] = [];
      let webhookTriggers: WebhookTrigger<typeof subscription>[] = [];

      if (subscription.status === "canceled") {
        webhookTriggers.push({
          event: "subscription.canceled",
          map: (subscription) => ({ id: subscription.id, ...(computeDiff(oldSubscription, subscription) ?? {}) }),
        });

        events.push({
          type: "subscription::canceled",
          map: (subscription) => ({
            customerId: subscription.customerId,
            subscriptionId: subscription.id,
          }),
        });
      } else {
        webhookTriggers.push({
          event: "subscription.updated",
          map: (subscription) => ({ id: subscription.id, ...(computeDiff(oldSubscription, subscription) ?? {}) }),
        });

        events.push({
          type: "subscription::updated",
          map: (subscription) => ({
            customerId: subscription.customerId,
            subscriptionId: subscription.id,
            data: {
              $changes: computeDiff(oldSubscription, subscription),
            },
          }),
        });
      }

      return {
        events,
        webhooks: { organizationId, environment, triggers: webhookTriggers },
      };
    }
  );
};

export const deleteSubscription = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.organizationId, organizationId),
        eq(subscriptions.environment, environment)
      )
    )
    .returning();

  return null;
};

export const retrieveDueSubscriptions = async () => {
  const results = await db
    .select({
      subscription: {
        id: subscriptions.id,
        productId: subscriptions.productId,
        organizationId: subscriptions.organizationId,
        environment: subscriptions.environment,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        assetId: products.assetId,
      },
      customer: { id: customers.id },
      asset: { code: assets.code, issuer: assets.issuer },
      wallet: customerWallets,
    })
    .from(subscriptions)
    .where(
      or(
        and(lt(subscriptions.currentPeriodEnd, new Date()), eq(subscriptions.status, "active")),
        and(
          eq(subscriptions.cancelAtPeriodEnd, true),
          lt(subscriptions.currentPeriodEnd, new Date()),
          isNull(subscriptions.canceledAt)
        )
      )
    )
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .innerJoin(assets, eq(products.assetId, assets.id))
    .innerJoin(customerWallets, eq(subscriptions.customerWalletId, customerWallets.id))
    .orderBy(desc(subscriptions.currentPeriodEnd));

  return results;
};
