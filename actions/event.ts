"use server";

import { resolveOrgContext } from "@/actions/organization";
import { triggerWebhooks } from "@/actions/webhook";
import { EventType } from "@/constant/schema.client";
import { Event, Network, db, events } from "@/db";
import { computeDiff } from "@/lib/utils";
import { LooseAutoComplete, WebhookEvent } from "@stellartools/core";
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
    map: (result: T) => Omit<EmitParams, "type">;
  },
  webhookConfig?: {
    organizationId: string;
    environment: Network;
    payload: (result: T) => Record<string, unknown>;
    events: Array<WebhookEvent>;
  }
): Promise<T> {
  const result = await action();

  const runSideEffects = async () => {
    try {
      if (eventConfig) {
        await emitEvent({ type: eventConfig.type, ...eventConfig.map(result) });
      }

      if (webhookConfig) {
        const data = webhookConfig.payload(result);
        await Promise.all(
          webhookConfig.events.map((event) =>
            triggerWebhooks(event, data, webhookConfig.organizationId, webhookConfig.environment)
          )
        );
      }
    } catch (err) {
      console.error(`[Side-Effect Event Error] ${eventConfig?.type}:`, err);
      console.error(
        `[Side-Effect Webhook Error] ${webhookConfig?.events.map((event) => event.toString()).join(", ")}:`,
        err
      );
    }
  };

  // Fire and forget
  waitUntil(runSideEffects());

  return result;
}

export const emitEvent = async (params: EmitParams, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db.insert(events).values({
    id: `evt_${nanoid(25)}`,
    organizationId,
    environment,
    ...params,
  });
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
