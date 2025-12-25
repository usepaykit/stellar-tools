import { Subscription, db, subscriptions } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postSubscription = async (params: Partial<Subscription>) => {
  const [subscription] = await db
    .insert(subscriptions)
    .values({ id: `sub_${nanoid(25)}`, ...params } as Subscription)
    .returning();

  return subscription;
};

export const retrieveSubscription = async (
  id: string,
  organizationId: string
) => {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.organizationId, organizationId)
      )
    )
    .limit(1);

  if (!subscription) throw new Error("Subscription not found");

  return subscription;
};

export const listSubscriptions = async (
  customerId: string,
  environment: string
) => {
  const subscriptionList = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.customerId, customerId),
        eq(subscriptions.environment, environment as any)
      )
    );

  return subscriptionList;
};

export const putSubscription = async (
  id: string,
  organizationId: string,
  updateData: Partial<Subscription>
) => {
  const [record] = await db
    .update(subscriptions)
    .set({ ...updateData, updatedAt: new Date() })
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.organizationId, organizationId)
      )
    )
    .returning();

  if (!record) throw new Error("Subscription not found");

  return record;
};

export const deleteSubscription = async (
  id: string,
  organizationId: string
) => {
  await db
    .delete(subscriptions)
    .where(
      and(
        eq(subscriptions.id, id),
        eq(subscriptions.organizationId, organizationId)
      )
    )
    .returning();

  return null;
};
