"use server";

import { Stellar } from "@/core/stellar";
import { WebhookDelivery } from "@/core/webhook-delivery";
import {
  Checkout,
  Network,
  Organization,
  Webhook,
  WebhookEvent,
  WebhookLog,
  db,
  webhookLogs,
  webhooks,
} from "@/db";
import { parseJSON } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { putCheckout } from "./checkout";
import { postPayment } from "./payment";

export const postWebhook = async (
  organizationId: string,
  data: Partial<Webhook>
) => {
  const [webhook] = await db
    .insert(webhooks)
    .values({
      id: `wh_${nanoid(25)}`,
      secretHash: `wh_sec_${nanoid(30)}`,
      isDisabled: false,
      organizationId,
      ...data,
    } as Webhook)
    .returning();

  if (!webhook) throw new Error("Failed to create webhook");

  return webhook as Webhook;
};

export const retrieveWebhooks = async (
  organizationId: string,
  environment: Network
) => {
  const webhooksResult = await db
    .select()
    .from(webhooks)
    .where(
      and(
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.environment, environment)
      )
    );

  if (!webhooksResult.length) throw new Error("Failed to retrieve webhooks");

  return webhooksResult;
};

export const retrieveWebhook = async (id: string, organizationId: string) => {
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(
      and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId))
    );

  if (!webhook) throw new Error("Failed to retrieve webhook");

  return webhook;
};

export const putWebhook = async (
  id: string,
  organizationId: string,
  data: Partial<Webhook>
) => {
  const [webhook] = await db
    .update(webhooks)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId))
    )
    .returning();

  if (!webhook) throw new Error("Failed to update webhook");

  return webhook;
};

export const deleteWebhook = async (id: string, organizationId: string) => {
  await db
    .delete(webhooks)
    .where(
      and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId))
    )
    .returning();

  return null;
};

export const postWebhookLog = async (
  webhookId: string,
  params: Partial<WebhookLog>
) => {
  const [webhookLog] = await db
    .insert(webhookLogs)
    .values({ webhookId, ...params } as WebhookLog)
    .returning();

  if (!webhookLog) throw new Error("Failed to create webhook log");

  return webhookLog;
};

export const retrieveWebhookLogs = async (
  webhookId: string,
  organizationId: string,
  environment: Network
) => {
  const webhookLogsResult = await db
    .select()
    .from(webhookLogs)
    .where(
      and(
        eq(webhookLogs.webhookId, webhookId),
        eq(webhookLogs.environment, environment),
        eq(webhookLogs.organizationId, organizationId)
      )
    );

  if (!webhookLogsResult.length)
    throw new Error("Failed to retrieve webhook logs");

  return webhookLogsResult;
};

export const retrieveWebhookLog = async (
  id: string,
  organizationId: string
) => {
  const [webhookLog] = await db
    .select()
    .from(webhookLogs)
    .where(
      and(
        eq(webhookLogs.id, id),
        eq(webhookLogs.organizationId, organizationId)
      )
    );

  if (!webhookLog) throw new Error("Failed to retrieve webhook log");

  return webhookLog;
};

export const putWebhookLog = async (
  id: string,
  organizationId: string,
  data: Partial<WebhookLog>
) => {
  const [webhookLog] = await db
    .update(webhookLogs)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(webhookLogs.id, id),
        eq(webhookLogs.organizationId, organizationId)
      )
    )
    .returning();

  if (!webhookLog) throw new Error("Failed to update webhook log");

  return webhookLog;
};

export const deleteWebhookLog = async (id: string, organizationId: string) => {
  await db
    .delete(webhookLogs)
    .where(
      and(
        eq(webhookLogs.id, id),
        eq(webhookLogs.organizationId, organizationId)
      )
    )
    .returning();

  return null;
};

// -- WEBHOOK INTERNALS --

export const triggerWebhooks = async (
  organizationId: string,
  eventType: WebhookEvent,
  payload: Record<string, unknown>,
  environment: Network
) => {
  const orgWebhooks = await db
    .select()
    .from(webhooks)
    .where(
      and(
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.environment, environment),
        eq(webhooks.isDisabled, false)
      )
    );

  const subscribedWebhooks = orgWebhooks.filter((webhook) =>
    webhook.events.includes(eventType)
  );

  if (subscribedWebhooks.length === 0) {
    console.log(
      `No webhooks subscribed to ${eventType} for org ${organizationId}`
    );
    return { success: true, delivered: 0 };
  }

  const results = await Promise.allSettled(
    subscribedWebhooks.map((webhook) =>
      new WebhookDelivery().deliver(webhook, eventType, payload, environment)
    )
  );

  const delivered = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(
    `Webhooks triggered for ${eventType}: ${delivered} delivered, ${failed} failed`
  );

  return { success: true, delivered, failed };
};

// STELLAR

export const processStellarWebhook = async (
  environment: Network,
  stellarAccount: NonNullable<Organization["stellarAccounts"]>[Network],
  organization: Organization,
  checkout?: Checkout
) => {
  const stellar = new Stellar(environment);

  const publicKey = stellarAccount?.public_key;

  if (!publicKey) return { error: "Stellar account not found" };

  stellar.streamTx(publicKey, {
    onError: (error) => {
      console.error("Stream error:", error);
    },
    onMessage: async (tx) => {
      const { amount } = parseJSON(
        tx.memo!,
        z.object({ amount: z.number(), checkoutId: z.string() })
      );

      if (checkout) {
        await Promise.all([
          putCheckout(checkout.id, organization.id, {
            status: "completed",
          }),
          postPayment({
            organizationId: organization.id,
            checkoutId: checkout.id,
            customerId: checkout.customerId,
            amount: amount * 10_000_000, // XLM to stroops
            transactionHash: tx.hash,
            status: "confirmed",
            environment,
          }),
        ]);

        await triggerWebhooks(
          organization.id,
          "payment.confirmed",
          { payment_id: tx.hash, checkout_id: checkout.id },
          environment
        );
      }

      return { data: { checkout } };
    },
  });

  return { data: { checkout } };
};
