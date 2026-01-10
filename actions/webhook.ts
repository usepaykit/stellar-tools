"use server";

import {
  Network,
  Organization,
  Webhook,
  WebhookLog,
  db,
  webhookLogs,
  webhooks,
} from "@/db";
import { Stellar } from "@/integrations/stellar";
import { WebhookDelivery } from "@/integrations/webhook-delivery";
import { parseJSON } from "@/lib/utils";
import { WebhookEvent } from "@stellartools/core";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { putCheckout, retrieveCheckout } from "./checkout";
import { resolveOrgContext } from "./organization";
import { postPayment } from "./payment";

export const postWebhook = async (
  orgId?: string,
  env?: Network,
  data?: Omit<Webhook, "id" | "organizationId" | "environment">
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhook] = await db
    .insert(webhooks)
    .values({
      ...data,
      id: `wh_${nanoid(25)}`,
      isDisabled: false,
      organizationId,
      environment,
    } as Webhook)
    .returning();

  if (!webhook) throw new Error("Failed to create webhook");

  return webhook as Webhook;
};

export const retrieveWebhooks = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

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

export const getWebhooksWithAnalytics = async (
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const result = await db
    .select({
      id: webhooks.id,
      organizationId: webhooks.organizationId,
      url: webhooks.url,
      secret: webhooks.secret,
      events: webhooks.events,
      name: webhooks.name,
      description: webhooks.description,
      isDisabled: webhooks.isDisabled,
      createdAt: webhooks.createdAt,
      updatedAt: webhooks.updatedAt,
      environment: webhooks.environment,
      logsCount: sql<number>`cast(count(${webhookLogs.id}) as integer)`.as(
        "logs_count"
      ),
      errorCount:
        sql<number>`cast(count(${webhookLogs.id}) filter (where ${webhookLogs.statusCode} >= 400 or ${webhookLogs.errorMessage} is not null) as integer)`.as(
          "error_count"
        ),
      responseTime: sql<number[]>`
        array_agg(${webhookLogs.responseTime} order by ${webhookLogs.createdAt} desc) 
        filter (where ${webhookLogs.responseTime} is not null)
      `.as("response_time"),
    })
    .from(webhooks)
    .leftJoin(webhookLogs, eq(webhookLogs.webhookId, webhooks.id))
    .where(
      and(
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.environment, environment)
      )
    )
    .groupBy(webhooks.id);

  if (!result.length) throw new Error("Failed to retrieve webhooks");

  return result.map((webhook) => ({
    ...webhook,
    errorRate:
      webhook.logsCount > 0
        ? Math.round((webhook.errorCount / webhook.logsCount) * 100)
        : 0,
    responseTime: webhook.responseTime ?? [],
  }));
};

export const retrieveWebhook = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(
      and(
        eq(webhooks.id, id),
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.environment, environment)
      )
    );

  if (!webhook) throw new Error("Failed to retrieve webhook");

  return webhook;
};

export const putWebhook = async (
  id: string,
  data: Partial<Webhook>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhook] = await db
    .update(webhooks)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(webhooks.id, id),
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.environment, environment)
      )
    )
    .returning();

  if (!webhook) throw new Error("Failed to update webhook");

  return webhook;
};

export const deleteWebhook = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(webhooks)
    .where(
      and(
        eq(webhooks.id, id),
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.environment, environment)
      )
    )
    .returning();

  return null;
};

export const postWebhookLog = async (
  webhookId: string,
  params: Omit<WebhookLog, "organizationId" | "environment" | "webhookId">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhookLog] = await db
    .insert(webhookLogs)
    .values({ ...params, webhookId, organizationId, environment } as WebhookLog)
    .returning();

  if (!webhookLog) throw new Error("Failed to create webhook log");

  return webhookLog;
};

export const retrieveWebhookLogs = async (
  webhookId: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const webhookLogsResult = await db
    .select()
    .from(webhookLogs)
    .where(
      and(
        eq(webhookLogs.webhookId, webhookId),
        eq(webhookLogs.organizationId, organizationId),
        eq(webhookLogs.environment, environment)
      )
    );

  if (!webhookLogsResult.length)
    throw new Error("Failed to retrieve webhook logs");

  return webhookLogsResult;
};

export const retrieveWebhookLog = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhookLog] = await db
    .select()
    .from(webhookLogs)
    .where(
      and(
        eq(webhookLogs.id, id),
        eq(webhookLogs.organizationId, organizationId),
        eq(webhookLogs.environment, environment)
      )
    );

  if (!webhookLog) throw new Error("Failed to retrieve webhook log");

  return webhookLog;
};

export const putWebhookLog = async (
  id: string,
  data: Partial<WebhookLog>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhookLog] = await db
    .update(webhookLogs)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(webhookLogs.id, id),
        eq(webhookLogs.organizationId, organizationId),
        eq(webhookLogs.environment, environment)
      )
    )
    .returning();

  if (!webhookLog) throw new Error("Failed to update webhook log");

  return webhookLog;
};

export const deleteWebhookLog = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(webhookLogs)
    .where(
      and(
        eq(webhookLogs.id, id),
        eq(webhookLogs.organizationId, organizationId),
        eq(webhookLogs.environment, environment)
      )
    )
    .returning();

  return null;
};

// -- WEBHOOK INTERNALS --

export const triggerWebhooks = async (
  eventType: WebhookEvent,
  payload: Record<string, unknown>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const orgWebhooks = await db
    .select()
    .from(webhooks)
    .where(
      and(
        eq(webhooks.organizationId, organizationId),
        eq(webhooks.isDisabled, false),
        eq(webhooks.environment, environment)
      )
    );

  const subscribedWebhooks = orgWebhooks.filter((webhook) =>
    webhook.events.includes(eventType)
  );

  if (subscribedWebhooks.length === 0) {
    console.log(
      `No webhooks subscribed to ${eventType} for org ${organizationId} in environment ${environment}`
    );
    return { success: true, delivered: 0 };
  }

  const results = await Promise.allSettled(
    subscribedWebhooks.map((webhook) =>
      new WebhookDelivery().deliver(webhook, eventType, payload)
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
  checkoutId: string
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

      const checkout = await retrieveCheckout(
        checkoutId,
        organization.id,
        environment
      );

      if (!checkout) {
        console.error(`Checkout ${checkoutId} not found`);
        return { error: "Checkout not found" };
      }

      await Promise.all([
        putCheckout(
          checkout.id,
          { status: "completed", updatedAt: new Date() },
          organization.id,
          environment
        ),
        postPayment(
          {
            checkoutId: checkout.id,
            customerId: checkout.customerId,
            amount: amount * 10_000_000, // XLM to stroops
            transactionHash: tx.hash,
            status: "confirmed",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          organization.id,
          environment
        ),
      ]);

      await triggerWebhooks(
        "payment.confirmed",
        {
          payment_id: tx.hash,
          checkout_id: checkout.id,
        },
        organization.id,
        environment
      );

      return { success: true };
    },
  });
};
