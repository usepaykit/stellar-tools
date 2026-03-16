"use server";

import { EventTrigger, WebhookTrigger, withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { Network, Refund, refunds } from "@/db";
import { db } from "@/db";
import { and, desc, eq } from "drizzle-orm";

export const postRefund = async (
  params: Omit<Refund, "organizationId" | "environment" | "createdAt" | "updatedAt">,
  orgId?: string,
  env?: Network,
  options?: { errorMessage?: string }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return withEvent(
    async () => {
      return await db
        .insert(refunds)
        .values({
          organizationId,
          environment,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...params,
        })
        .returning()
        .then(([refund]) => refund);
    },
    (refund) => {
      let events: EventTrigger<typeof refund>[] = [];
      let webhooksTriggers: WebhookTrigger<typeof refund>[] = [];

      if (refund.status == "failed") {
        events.push({
          type: "refund::failed",
          map: ({ id: refundId, customerId, paymentId, amount, assetCode }) => ({
            customerId,
            data: { paymentId, refundId, amount: `${amount} ${assetCode}` },
          }),
        });

        webhooksTriggers.push({
          event: "refund.failed",
          map: ({ id: refundId, paymentId, amount, customerId, assetCode }) => ({
            paymentId,
            amount: `${amount} ${assetCode}`,
            refundId,
            customerId,
            error: options?.errorMessage,
          }),
        });
      }

      if (refund.status == "succeeded") {
        events.push({
          type: "refund::created",
          map: ({ id: refundId, paymentId, amount, customerId, assetCode, reason }) => ({
            customerId,
            data: { paymentId, refundId, amount: `${amount} ${assetCode}`, reason },
          }),
        });

        webhooksTriggers.push({
          event: "refund.succeeded",
          map: ({ id: refundId, paymentId, amount, customerId, assetCode, reason }) => ({
            amount: `${amount} ${assetCode}`,
            paymentId,
            customerId,
            refundId,
            reason,
          }),
        });
      }
      return {
        events,
        webhooks: { organizationId, environment, triggers: [] },
      };
    }
  );
};

export const getRefund = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [refund] = await db
    .select()
    .from(refunds)
    .where(and(eq(refunds.id, id), eq(refunds.organizationId, organizationId), eq(refunds.environment, environment)))
    .limit(1);

  if (!refund) throw new Error("Refund not found");

  return refund;
};

export const updateRefund = async (id: string, retUpdate: Partial<Refund>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [refund] = await db
    .update(refunds)
    .set({ ...retUpdate, updatedAt: new Date() } as Refund)
    .where(and(eq(refunds.id, id), eq(refunds.organizationId, organizationId), eq(refunds.environment, environment)))
    .returning();

  if (!refund) throw new Error("Failed to update refund");

  return refund as Refund;
};

export const deleteRefund = async (id: string, organizationId: string) => {
  await db
    .delete(refunds)
    .where(and(eq(refunds.id, id), eq(refunds.organizationId, organizationId)))
    .returning();

  return null;
};

export const getRefunds = async (organizationId: string) => {
  const refundsList = await db
    .select()
    .from(refunds)
    .where(eq(refunds.organizationId, organizationId))
    .orderBy(desc(refunds.createdAt));

  if (!refundsList) throw new Error("Failed to get refunds");

  return refundsList;
};
