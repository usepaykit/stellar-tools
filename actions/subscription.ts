import { Subscription, db, subscriptions } from "@/db";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postSubscription = async (params: Partial<Subscription>) => {
  const subscriptionId = `sub_${nanoid(25)}`;

  // Use raw SQL with a subquery to validate product type
  const result = await db.execute<Subscription>(sql`
    WITH validated_product AS (
      SELECT id 
      FROM product 
      WHERE id = ${params.productId} 
        AND type = 'subscription'::product_type
        AND organization_id = ${params.organizationId}
    )
    INSERT INTO subscription (
      id, customer_id, product_id, status, organization_id,
      current_period_start, current_period_end, 
      cancel_at_period_end, canceled_at, paused_at,
      last_payment_id, next_billing_date, failed_payment_count,
      created_at, updated_at, metadata, network
    )
    SELECT 
      ${subscriptionId},
      ${params.customerId},
      validated_product.id,
      ${params.status},
      ${params.organizationId},
      ${params.currentPeriodStart},
      ${params.currentPeriodEnd},
      COALESCE(${params.cancelAtPeriodEnd}, false),
      ${params.canceledAt},
      ${params.pausedAt},
      ${params.lastPaymentId},
      ${params.nextBillingDate},
      COALESCE(${params.failedPaymentCount}, 0),
      NOW(),
      NOW(),
      COALESCE(${params.metadata ? sql`${params.metadata}::jsonb` : sql`'{}'::jsonb`}),
      ${params.environment}
    FROM validated_product
    RETURNING *
  `);

  if (result.length === 0) {
    throw new Error(
      `Product ${params.productId} is not a subscription product or doesn't exist`
    );
  }

  return result[0];
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
