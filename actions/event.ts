"use server";

import { resolveOrgContext } from "@/actions/organization";
import { triggerWebhooks } from "@/actions/webhook";
import { EventType } from "@/constant/schema.client";
import { Event, Network, db, events } from "@/db";
import { computeDiff } from "@/lib/utils";
import { LooseAutoComplete, MaybeArray, WebhookEvent, chunk } from "@stellartools/core";
import { waitUntil } from "@vercel/functions";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

type EventDataDiff = { $changes?: Record<string, ReturnType<typeof computeDiff>> };

interface EmitParams {
  type: EventType;
  customerId?: string; // for customer operations
  merchantId?: string; // for merchant operations
  data?: Record<string, string | number | boolean | null | undefined | Date | EventDataDiff>;
}

export async function withEvent<T>(
  action: () => Promise<T>,
  eventConfig?: {
    type: EventType;
    map: (result: T) => MaybeArray<Omit<EmitParams, "type">>;
  },
  webhookConfig?: {
    organizationId: string;
    environment: Network;
    payload: (result: T) => MaybeArray<Record<string, unknown>>;
    events: Array<WebhookEvent>;
  }
): Promise<T> {
  const result = await action();

  const runSideEffects = async () => {
    try {
      if (eventConfig) {
        const mapped = eventConfig.map(result);
        const eventArray = Array.isArray(mapped) ? mapped : [mapped];

        await emitEvents(eventArray.map((e) => ({ ...e, type: eventConfig.type })));
      }

      if (webhookConfig) {
        const data = webhookConfig.payload(result);
        const dataArray = Array.isArray(data) ? data : [data];

        const calls = dataArray.flatMap((item) =>
          webhookConfig.events.map((event) => ({
            event,
            payload: item,
            orgId: webhookConfig.organizationId,
            env: webhookConfig.environment,
          }))
        );

        // Configuration for the background throttler
        const BATCH_SIZE = 5;
        const BATCH_DELAY = 150; // ms between batches
        const batches = chunk(calls, BATCH_SIZE);

        for (const batch of batches) {
          await Promise.allSettled(
            batch.map(({ event, payload, orgId, env }) =>
              triggerWebhooks(event, payload, orgId, env).catch((err) => {
                console.error(`[Webhook Error] ${event} for ${orgId}:`, err);
              })
            )
          );

          if (batches.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
          }
        }
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
