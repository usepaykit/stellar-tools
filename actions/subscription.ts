"use server";

import { Network, Subscription, customers, db, products, subscriptions } from "@/db";
import { and, desc, eq, lt } from "drizzle-orm";
import { nanoid } from "nanoid";

import { resolveOrgContext } from "./organization";

export const postSubscriptionsBulk = async (
  params: { customerIds: string[]; productId: string; period: { from: Date; to: Date }; cancelAtPeriodEnd: boolean },
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const values = params.customerIds.map((cid) => ({
    id: `sub_${nanoid(20)}`,
    customerId: cid,
    productId: params.productId,
    status: "active" as const,
    organizationId,
    environment,
    currentPeriodStart: params.period.from,
    currentPeriodEnd: params.period.to,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd,
    nextBillingDate: params.period.to,
  }));

  return await db.insert(subscriptions).values(values).returning();
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
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

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
      subscription: { id: subscriptions.id, productId: subscriptions.productId },
      customer: { walletAddresses: customers.walletAddresses },
    })
    .from(subscriptions)
    .where(and(lt(subscriptions.nextBillingDate, new Date()), eq(subscriptions.status, "active")))
    .innerJoin(customers, eq(subscriptions.customerId, customers.id))
    .orderBy(desc(subscriptions.nextBillingDate));

  return results;
};
