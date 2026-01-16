"use server";

import { resolveOrgContext } from "@/actions/organization";
import { EventType } from "@/constant/schema.client";
import { Event, Network, db, events } from "@/db";
import { LooseAutoComplete } from "@stellartools/core";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

interface EmitParams {
  type: EventType;
  customerId?: string; // for customer operations
  merchantId?: string; // for merchant operations
  data?: Record<string, any>;
}

export async function withEvent<T>(
  action: () => Promise<T>,
  eventConfig: {
    type: EventType;
    map: (result: T) => Omit<EmitParams, "type">;
  }
): Promise<T> {
  const result = await action();

  const eventParams = {
    type: eventConfig.type,
    ...eventConfig.map(result),
  };

  emitEvent(eventParams).catch((err) => {
    console.error(`[Event Error] Failed to emit ${eventConfig.type}:`, err);
  });

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
