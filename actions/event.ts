"use server";

import { resolveOrgContext } from "@/actions/organization";
import { triggerWebhooks } from "@/actions/webhook";
import { EventType } from "@/constant/schema.client";
import { Event, Network, db, events, rawDb, txContext } from "@/db";
import { generateResourceId } from "@/lib/utils";
import { EventConfig, EventEmitParams } from "@/types";
import { MaybePromise, SuggestedString, WebhookEvent, WebhookEventBase } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";
import { and, desc, eq, inArray } from "drizzle-orm";
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
      const correlatedId = generateResourceId("evt", webhookConfig?.organizationId ?? "sys", 32);

      if (eventConfigs) {
        const configsArray = Array.isArray(eventConfigs) ? eventConfigs : [eventConfigs];
        const internalEvents = configsArray.flatMap((cfg) => {
          const mapped = cfg.map(result);
          return (Array.isArray(mapped) ? mapped : [mapped]).map((data) => ({ ...data, type: cfg.type }));
        });

        if (internalEvents.length > 0) {
          const orgId = webhookConfig?.organizationId;
          const env = webhookConfig?.environment;

          await emitEvents(
            internalEvents.map(({ data, ...evt }) => ({ ...evt, data: { ...data, eventId: correlatedId } })),
            orgId,
            env
          );
        }
      }

      if (webhookConfig?.triggers) {
        const { triggers, organizationId, environment } = webhookConfig;
        const triggersArray = Array.isArray(triggers) ? triggers : [triggers];

        const deliveries = triggersArray.map((trigger) => {
          const mapped = trigger.map(result);

          const envelope: WebhookEventBase<any, any> = {
            id: correlatedId,
            type: trigger.event,
            created: new Date().toISOString(),
            data: {
              object: mapped.object,
              previous_attributes: mapped.previous_attributes,
            },
          };

          return triggerWebhooks(trigger.event, envelope, correlatedId, organizationId, environment);
        });

        if (deliveries.length > 0) await Promise.allSettled(deliveries);
      }
    } catch (err) {
      console.error(`[Side-Effect Critical Failure]:`, err);
    }
  };

  const buffer = effectBuffer.getStore();

  if (buffer) {
    // If we are in an Atomic Chain, just queue the side effect
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
