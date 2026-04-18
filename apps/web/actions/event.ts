"use server";

import { MaybePromise, SuggestedString, WebhookEventBase } from "@stellartools/core";
import { EventType } from "@stellartools/web/constant";
import { Event, Network, db, events, rawDb, txContext } from "@stellartools/web/db";
import { generateResourceId } from "@stellartools/web/lib";
import { EventConfig, EventEmitParams } from "@stellartools/web/types";
import { waitUntil } from "@vercel/functions";
import { SQL, and, desc, eq, inArray } from "drizzle-orm";
import _ from "lodash";
import { AsyncLocalStorage } from "node:async_hooks";

import { resolveOrgContext } from "./organization";
import { retrieveWebhooks, triggerWebhooks } from "./webhook";

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

      const triggers = webhookConfig?.triggers
        ? Array.isArray(webhookConfig.triggers)
          ? webhookConfig.triggers
          : [webhookConfig.triggers]
        : [];
      const internalConfigs = eventConfigs ? (Array.isArray(eventConfigs) ? eventConfigs : [eventConfigs]) : [];

      if (triggers.length === 0 && internalConfigs.length === 0) return;

      const { organizationId: orgId, environment: env } = webhookConfig!;

      const subscribers =
        triggers.length > 0 ? await retrieveWebhooks(orgId, env, { events: triggers.map((t) => t.event) }) : [];

      const hasActiveWebhooks = subscribers.length > 0;

      const webhookLogId = hasActiveWebhooks ? generateResourceId("wh_evt", orgId, 52) : undefined;

      if (internalConfigs.length > 0) {
        const eventsToEmit = internalConfigs.flatMap((cfg) => {
          const mapped = cfg.map(result);
          return (Array.isArray(mapped) ? mapped : [mapped]).map((m) => ({
            ...m,
            type: cfg.type,
            data: webhookLogId ? { ...m.data, webhookLogId } : m.data,
          }));
        });
        await emitEvents(eventsToEmit, orgId, env);
      }

      if (hasActiveWebhooks) {
        const deliveries = triggers.map((trigger) => {
          const targets = subscribers.filter((s) => s.events.includes(trigger.event));
          if (targets.length === 0) return Promise.resolve();

          const mapped = trigger.map(result);
          const envelope: WebhookEventBase<any, any> = {
            id: webhookLogId!,
            type: trigger.event,
            created: new Date().toISOString(),
            livemode: env === "mainnet",
            data: mapped,
          };

          return triggerWebhooks(targets, trigger.event, envelope, webhookLogId!);
        });

        await Promise.allSettled(deliveries);
      }
    } catch (err) {
      console.error(`[Side-Effect Critical Failure]:`, err);
    }
  };

  const buffer = effectBuffer.getStore();
  if (buffer) {
    buffer.push(runSideEffects);
  } else {
    if (typeof waitUntil === "function") waitUntil(runSideEffects());
    else runSideEffects();
  }

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
    .orderBy(desc(events.createdAt));
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
