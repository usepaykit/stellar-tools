"use server";

import { resolveOrgContext } from "@/actions/organization";
import { Network, Webhook, WebhookLog, db, webhookLogs, webhooks } from "@/db";
import { deliverWebhook } from "@/integrations/webhook-delivery";
import { toSnakeCase } from "@/lib/utils";
import { generateResourceId } from "@/lib/utils";
import { WebhookEvent } from "@stellartools/core";
import { and, eq, sql } from "drizzle-orm";

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
      id: generateResourceId("wh", organizationId, 20),
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
    .where(and(eq(webhooks.organizationId, organizationId), eq(webhooks.environment, environment)));

  if (!webhooksResult.length) throw new Error("Failed to retrieve webhooks");

  return webhooksResult;
};

export const getWebhooksWithAnalytics = async (orgId?: string, env?: Network) => {
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
      logsCount: sql<number>`cast(count(${webhookLogs.id}) as integer)`.as("logs_count"),
      errorCount: sql<number>`cast(count(${webhookLogs.id}) filter (where ${webhookLogs.statusCode} >= 400) as integer)`,
      hourlyActivity: sql<Array<{ h: string; c: number }>>`
        (SELECT coalesce(jsonb_agg(item), '[]'::jsonb) FROM (
          SELECT 
            to_char(date_trunc('hour', ${webhookLogs.createdAt}), 'YYYY-MM-DD"T"HH24') as h, 
            count(*)::int as c
          FROM ${webhookLogs}
          WHERE ${webhookLogs.webhookId} = ${webhooks.id} 
            AND ${webhookLogs.createdAt} >= NOW() - INTERVAL '24 hours'
          GROUP BY 1 ORDER BY 1
        ) item)
      `,
      responseTime: sql<number[]>`
        array_agg(${webhookLogs.responseTime} order by ${webhookLogs.createdAt} desc) 
        filter (where ${webhookLogs.responseTime} is not null)
      `,
    })
    .from(webhooks)
    .leftJoin(webhookLogs, eq(webhookLogs.webhookId, webhooks.id))
    .where(and(eq(webhooks.organizationId, organizationId), eq(webhooks.environment, environment)))
    .groupBy(webhooks.id);

  return result.map((webhook) => ({
    ...webhook,
    errorRate: webhook.logsCount > 0 ? Math.round((webhook.errorCount / webhook.logsCount) * 100) : 0,
    responseTimeHistory: (webhook.responseTime ?? []).slice(0, 50).reverse(),
  }));
};

export const retrieveWebhook = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(
      and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId), eq(webhooks.environment, environment))
    );

  if (!webhook) throw new Error("Failed to retrieve webhook");

  return webhook;
};

export const putWebhook = async (id: string, data: Partial<Webhook>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [webhook] = await db
    .update(webhooks)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId), eq(webhooks.environment, environment)))
    .returning();

  if (!webhook) throw new Error("Failed to update webhook");

  return webhook;
};

export const deleteWebhook = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(webhooks)
    .where(and(eq(webhooks.id, id), eq(webhooks.organizationId, organizationId), eq(webhooks.environment, environment)))
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

export const retrieveWebhookLogs = async (webhookId: string, orgId?: string, env?: Network) => {
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

  return webhookLogsResult;
};

export const retrieveWebhookLog = async (id: string, orgId?: string, env?: Network) => {
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

  return webhookLog;
};

export const putWebhookLog = async (id: string, data: Partial<WebhookLog>, orgId?: string, env?: Network) => {
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

export const deleteWebhookLog = async (id: string, orgId?: string, env?: Network) => {
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
  logId: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const snakePayload = toSnakeCase(payload);

  const subscribers = (
    await db
      .select()
      .from(webhooks)
      .where(
        and(
          eq(webhooks.organizationId, organizationId),
          eq(webhooks.isDisabled, false),
          eq(webhooks.environment, environment)
        )
      )
  ).filter((w) => w.events.includes(eventType));

  if (subscribers.length === 0) return { success: true, delivered: 0 };

  const results = await Promise.allSettled(
    subscribers.map((webhook) => deliverWebhook(webhook, eventType, snakePayload as Record<string, unknown>, logId))
  );

  return {
    success: true,
    delivered: results.filter((r) => r.status === "fulfilled").length,
  };
};

export const resendWebhookLog = async (
  webhookId: string,
  eventType: WebhookEvent,
  payload: Record<string, unknown>,
  orgId?: string,
  env?: Network
) => {
  const webhook = await retrieveWebhook(webhookId, orgId, env);
  const normalizedPayload = toSnakeCase(payload) as Record<string, unknown>;

  const logId = generateResourceId("wh_evt", webhookId, 52);

  return deliverWebhook(webhook, eventType, normalizedPayload, logId);
};
