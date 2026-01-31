"use server";

import { resolveOrgContext } from "@/actions/organization";
import { triggerWebhooks } from "@/actions/webhook";
import { EventType } from "@/constant/schema.client";
import { Event, Network, db, events } from "@/db";
import { computeDiff } from "@/lib/utils";
import { LooseAutoComplete, MaybeArray, WebhookEvent, chunk } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";
import { and, desc, eq, inArray } from "drizzle-orm";
import _ from "lodash";
import { nanoid } from "nanoid";

type EventDataDiff = { $changes?: Record<string, ReturnType<typeof computeDiff>> };

interface EmitParams {
  type: EventType;
  customerId?: string; // for customer operations
  merchantId?: string; // for merchant operations
  data?: Record<string, string | number | boolean | null | undefined | Date | EventDataDiff>;
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

export async function withEvent<T>(
  action: () => Promise<T>,
  configs?: EventConfig<T> | ((result: T) => EventConfig<T> | undefined)
): Promise<T> {
  const result = await action();

  const runSideEffects = async () => {
    try {
      const resolved = typeof configs === "function" ? configs(result) : configs;

      if (!resolved) return;

      const { events: eventConfigs, webhooks: webhookConfig } = resolved;

      if (eventConfigs) {
        const configsArray = Array.isArray(eventConfigs) ? eventConfigs : [eventConfigs];
        const internalEvents = configsArray.flatMap((cfg) => {
          const mapped = cfg.map(result);
          return (Array.isArray(mapped) ? mapped : [mapped]).map((data) => ({ ...data, type: cfg.type }));
        });

        if (internalEvents.length > 0) await emitEvents(internalEvents);
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

  if (typeof waitUntil === "function") {
    waitUntil(runSideEffects());
  } else {
    runSideEffects();
  }

  return result;
}

export const emitEvents = async (params: Array<EmitParams>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .insert(events)
    .values(params.map((p) => ({ id: `evt_${nanoid(25)}`, organizationId, environment, ...p })));
};

type NarrowedEvent<T extends EventType> = Event & { type: T };

type NarrowedEvents<T extends readonly EventType[]> = Array<NarrowedEvent<T[number]>>;

export const retrieveEvents = async <T extends readonly EventType[]>(
  filters: { customerId?: string; merchantId?: LooseAutoComplete<"current"> },
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
