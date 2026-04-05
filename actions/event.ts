"use server";

import { resolveOrgContext } from "@/actions/organization";
import { triggerWebhooks } from "@/actions/webhook";
import { EventType } from "@/constant/schema.client";
import { Event, Network, db, events, rawDb, txContext } from "@/db";
import { computeDiff, generateResourceId } from "@/lib/utils";
import { MaybeArray, MaybePromise, SuggestedString, WebhookEvent } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";
import { and, desc, eq, inArray } from "drizzle-orm";
import _ from "lodash";
import { AsyncLocalStorage } from "node:async_hooks";

type EventDataDiff = { $changes?: ReturnType<typeof computeDiff> };

interface EmitParams {
  type: EventType;
  customerId?: string | null; // for customer operations
  merchantId?: string | null; // for merchant operations
  data?: Record<
    string,
    string | number | boolean | null | undefined | Date | EventDataDiff | ReturnType<typeof computeDiff>
  >;
}

export interface EventTrigger<T> {
  type: EventType;
  map: (result: T) => MaybeArray<Omit<EmitParams, "type">>;
}

export interface WebhookTrigger<T> {
  event: WebhookEvent;
  map: (result: T) => MaybeArray<Record<string, unknown>>;
}

export interface EventConfig<T> {
  events?: MaybeArray<EventTrigger<T>>;
  webhooks?: {
    organizationId: string;
    environment: Network;
    triggers: MaybeArray<WebhookTrigger<T>>;
  };
}

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

      if (eventConfigs) {
        const configsArray = Array.isArray(eventConfigs) ? eventConfigs : [eventConfigs];
        const internalEvents = configsArray.flatMap((cfg) => {
          const mapped = cfg.map(result);
          return (Array.isArray(mapped) ? mapped : [mapped]).map((data) => ({ ...data, type: cfg.type }));
        });

        if (internalEvents.length > 0) {
          const orgId = webhookConfig?.organizationId;
          const env = webhookConfig?.environment;
          await emitEvents(internalEvents, orgId, env);
        }
      }

      if (webhookConfig?.triggers) {
        const { triggers, organizationId, environment } = webhookConfig;
        const triggersArray = Array.isArray(triggers) ? triggers : [triggers];

        const deliveries = triggersArray.flatMap((trigger) => {
          const payloads = trigger.map(result);
          return (Array.isArray(payloads) ? payloads : [payloads]).map((payload) =>
            triggerWebhooks(trigger.event, payload, organizationId, environment).catch((err) => {
              console.error(`[Webhook Error] ${trigger.event} for ${organizationId}:`, err);
            })
          );
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

export const emitEvents = async (params: Array<EmitParams>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .insert(events)
    .values(
      params.map((p) => ({ id: generateResourceId("evt", organizationId, 25), organizationId, environment, ...p }))
    )
    .returning()
    .then(([event]) => event);
};

type NarrowedEvent<T extends EventType> = Event & { type: T };

type NarrowedEvents<T extends readonly EventType[]> = Array<NarrowedEvent<T[number]>>;

export const retrieveEvents = async <T extends readonly EventType[]>(
  filters: { customerId?: string; merchantId?: SuggestedString<"current"> },
  eventTypes?: T,
  orgId?: string,
  env?: Network
): Promise<NarrowedEvents<T>> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const merchantId = filters.merchantId === "current" ? organizationId : filters.merchantId;

  return await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.organizationId, organizationId),
        eq(events.environment, environment),
        filters.customerId ? eq(events.customerId, filters.customerId) : undefined,
        merchantId ? eq(events.merchantId, String(merchantId)) : undefined,
        eventTypes ? inArray(events.type, eventTypes) : undefined
      )
    )
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
