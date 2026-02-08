"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { SubscriptionStatus } from "@/constant/schema.client";
import { Network, Subscription, assets, customerWallets, customers, db, products, subscriptions } from "@/db";
import { computeDiff, generateResourceId } from "@/lib/utils";
import { and, desc, eq, lt } from "drizzle-orm";

export const postSubscriptionsBulk = async (
  params: { customerIds: string[]; productId: string; period: { from: Date; to: Date }; cancelAtPeriodEnd: boolean },
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return withEvent(
    async () => {
      const values = params.customerIds.map((cid) => ({
        id: generateResourceId("sub", organizationId, 20),
        customerId: cid,
        productId: params.productId,
        status: "active" as const,
        organizationId,
        environment,
        currentPeriodStart: params.period.from,
        currentPeriodEnd: params.period.to,
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

export const retrieveSubscription = async (id: string) => {
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).limit(1);

  if (!subscription) throw new Error("Subscription not found");

  return subscription;
};

export const retrieveSubscriptions = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select({
      subscription: subscriptions,
      customer: { name: customers.name, email: customers.email },
      product: { name: products.name, priceAmount: products.priceAmount },
    })
    .from(subscriptions)
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .where(and(eq(subscriptions.organizationId, organizationId), eq(subscriptions.environment, environment)))
    .orderBy(desc(subscriptions.createdAt));
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
    {
      events: [
        {
          type: "subscription::updated",
          map: (subscription) => ({
            customerId: subscription.customerId,
            data: {
              $changes: {
                ...computeDiff(oldSubscription ?? {}, subscription, undefined, "."),
                status: subscription.status,
              } as Record<string, ReturnType<typeof computeDiff> | SubscriptionStatus>,
            },
          }),
        },
      ],
      webhooks: {
        organizationId,
        environment,
        triggers: [
          {
            event: "subscription.updated",
            map: (subscription) => ({
              id: subscription.id,
              changes: { ...computeDiff(oldSubscription ?? {}, subscription), status: subscription.status },
            }),
          },
        ],
      },
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
      },
      customer: { id: customers.id },
      asset: { code: assets.code, issuer: assets.issuer },
      wallet: customerWallets,
    })
    .from(subscriptions)
    .where(and(lt(subscriptions.currentPeriodEnd, new Date()), eq(subscriptions.status, "active")))
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .innerJoin(products, eq(subscriptions.productId, products.id))
    .innerJoin(assets, eq(products.assetId, assets.id))
    .innerJoin(customerWallets, eq(subscriptions.walletId, customerWallets.id))
    .orderBy(desc(subscriptions.currentPeriodEnd));

  return results;
};
