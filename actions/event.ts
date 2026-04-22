"use server";

import { retrieveInstalledApps } from "@/actions/app";
import { resolveOrgContext } from "@/actions/organization";
import { retrieveWebhooks, triggerWebhooks } from "@/actions/webhook";
import { Event, Network, db, events, rawDb, txContext } from "@/db";
import { deliverToApp } from "@/integrations/app-delivery";
import { getResourceForEvent } from "@/lib/app-utils";
import { generateResourceId } from "@/lib/utils";
import { EventConfig, EventEmitParams } from "@/types";
import { EventType } from "@stellartools/app-embed-bridge";
import { MaybePromise, SuggestedString, WebhookEventBase } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";
import { SQL, and, desc, eq, inArray } from "drizzle-orm";
import _ from "lodash";
import { AsyncLocalStorage } from "node:async_hooks";

const effectBuffer = new AsyncLocalStorage<Array<() => Promise<void>>>();

export async function withEvent<T>(
  action: () => Promise<T>,
  configs?: EventConfig<T> | ((result: T) => MaybePromise<EventConfig<T> | undefined>)
): Promise<T> {
  const result = await action();

  const runSideEffects = async () => {
    try {
      const resolved = await (typeof configs === "function" ? configs(result) : configs);
      if (!resolved) return;

      const { events: eventConfigs, webhooks: webhookConfig } = resolved;
      const { organizationId: orgId, environment: env } = webhookConfig!;

      // 1. Identify active merchant webhooks
      const triggers = webhookConfig?.triggers
        ? Array.isArray(webhookConfig.triggers)
          ? webhookConfig.triggers
          : [webhookConfig.triggers]
        : [];

      const subscribers =
        triggers.length > 0 ? await retrieveWebhooks(orgId, env, { events: triggers.map((t) => t.event) }) : [];

      // 2. DISCOVER INSTALLED APPS (Plugins)
      // Logic: If an action emits "customer::created", find apps with "read:customers" scope.
      const primaryEvent = Array.isArray(eventConfigs) ? eventConfigs[0] : eventConfigs;
      const resource = primaryEvent ? getResourceForEvent(primaryEvent.type) : undefined;
      const requiredScope = resource ? (`read:${resource}` as const) : null;

      const installedApps = requiredScope
        ? await retrieveInstalledApps({ status: "active", scopes: [requiredScope] }, orgId, env)
        : [];

      const hasWork = subscribers.length > 0 || installedApps.length > 0;
      const webhookLogId = hasWork ? generateResourceId("wh_evt", orgId, 52) : undefined;

      // 3. EMIT INTERNAL EVENTS (Dashboard Timeline)
      if (eventConfigs) {
        const eventsToEmit = (Array.isArray(eventConfigs) ? eventConfigs : [eventConfigs]).flatMap((cfg) => {
          const mapped = cfg.map(result);
          return (Array.isArray(mapped) ? mapped : [mapped]).map((m) => ({
            ...m,
            type: cfg.type,
            data: webhookLogId ? { ...m.data, webhookLogId } : m.data,
          }));
        });
        await emitEvents(eventsToEmit, orgId, env);
      }

      // 4. DISPATCH WEBHOOKS (To Merchant + To Installed Apps)
      const deliveries: Promise<any>[] = [];

      // A. Standard Merchant Webhooks
      if (subscribers.length > 0) {
        triggers.forEach((trigger) => {
          const targets = subscribers.filter((s) => s.events.includes(trigger.event));
          if (targets.length === 0) return;

          const envelope: WebhookEventBase<any, any> = {
            id: webhookLogId!,
            type: trigger.event,
            created: new Date().toISOString(),
            livemode: env === "mainnet",
            data: trigger.map(result),
          };
          deliveries.push(triggerWebhooks(targets, trigger.event, envelope, webhookLogId!));
        });
      }

      // B. Plugin/App Webhooks (Partner servers)
      if (installedApps.length > 0) {
        installedApps.forEach(({ app, app_installation }) => {
          if (!app?.manifest?.events?.includes(primaryEvent!.type)) return;

          const envelope = {
            id: webhookLogId!,
            type: primaryEvent!.type,
            created: new Date().toISOString(),
            livemode: env === "mainnet",
            installationId: app_installation.id, // CRACKED: Partner needs to know WHICH installation this is
            data: primaryEvent!.map(result) as Record<string, unknown>,
          };

          // deliverToApp helper uses app.webhookUrl and app.appSecret for signing
          deliveries.push(deliverToApp(app, app_installation.id, envelope, webhookLogId!));
        });
      }

      await Promise.allSettled(deliveries);
    } catch (err) {
      console.error(`[Side-Effect Critical Failure]:`, err);
    }
  };

  // Standard execution logic...
  const buffer = effectBuffer.getStore();
  if (buffer) buffer.push(runSideEffects);
  else if (typeof waitUntil === "function") waitUntil(runSideEffects());
  else runSideEffects();

  return result;
}

export const emitEvents = async (params: Array<EventEmitParams>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .insert(events)
    .values(
      params.map((p) => ({ ...p, id: generateResourceId("evt", organizationId, 25), organizationId, environment }))
    )
    .returning()
    .then(([event]) => event);
};

type NarrowedEvent<T extends EventType> = Event & { type: T };

type NarrowedEvents<T extends readonly EventType[]> = Array<NarrowedEvent<T[number]>>;

export const retrieveEvents = async <T extends readonly EventType[]>(
  filters: { customerId?: string; merchantId?: SuggestedString<"current">; subscriptionId?: string },
  eventTypes?: T,
  orgId?: string,
  env?: Network
): Promise<NarrowedEvents<T>> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let whereClause = [];

  if (filters?.customerId) {
    whereClause.push(eq(events.customerId, filters.customerId));
  }

  if (filters.merchantId == "current") {
    whereClause.push(eq(events.merchantId, organizationId));
  } else if (filters.merchantId) {
    whereClause.push(eq(events.merchantId, filters.merchantId));
  }
  if (filters.subscriptionId) {
    whereClause.push(eq(events.subscriptionId, filters.subscriptionId));
  }
  if (eventTypes) {
    whereClause.push(inArray(events.type, eventTypes));
  }

  return await db
    .select()
    .from(events)
    .where(and(eq(events.organizationId, organizationId), eq(events.environment, environment), ...whereClause))
    .orderBy(desc(events.createdAt))
    .then((events) => events.map((e) => ({ ...e, type: e.type as T[number] })));
};

export const deleteEvents = async (
  filters: { customerId?: string; merchantId?: string; subscriptionId?: string },
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let whereClause: Array<SQL<unknown>> = [];

  if (filters?.customerId) {
    whereClause.push(eq(events.customerId, filters.customerId));
  }

  if (filters.merchantId == "current") {
    whereClause.push(eq(events.merchantId, organizationId));
  } else if (filters.merchantId) {
    whereClause.push(eq(events.merchantId, filters.merchantId));
  }
  if (filters.subscriptionId) {
    whereClause.push(eq(events.subscriptionId, filters.subscriptionId));
  }

  return await db
    .delete(events)
    .where(and(eq(events.organizationId, organizationId), eq(events.environment, environment), ...whereClause));
};

/**
 * Runs multiple actions atomically.
 * If any DB call fails, everything rolls back.
 * If any DB call fails, NO side-effects are fired.
 * NB: This works because of the Proxy on the db instance used in all actions.
 */
export async function runAtomic<T>(fn: () => Promise<T>): Promise<T> {
  const sideEffects: Array<() => Promise<void>> = [];

  return await effectBuffer.run(sideEffects, async () => {
    return await rawDb.transaction(async (tx) => {
      return await txContext.run(tx, async () => {
        const result = await fn();

        sideEffects.forEach((effect) => {
          if (typeof waitUntil === "function") waitUntil(effect());
          else effect();
        });

        return result;
      });
    });
  });
}
