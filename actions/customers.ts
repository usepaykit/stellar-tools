"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { Customer, Network, customers, db } from "@/db";
import { computeDiff } from "@/lib/utils";
import { MaybeArray } from "@stellartools/core";
import { SQL, and, eq, inArray, or } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postCustomers = async (
  params: Omit<Customer, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt">[],
  orgId?: string,
  env?: Network,
  options?: { source?: string }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return withEvent(
    async () => {
      const results = await db
        .insert(customers)
        .values(params.map((p) => ({ ...p, id: `cus_${nanoid(25)}`, organizationId, environment })))
        .returning();

      return results;
    },
    (customers) => {
      const data = customers.map(({ id, name, email, phone, metadata }) => ({
        id,
        name,
        email,
        phone,
        metadata,
        ...(options?.source ? { source: options.source } : {}),
      }));

      return {
        events: [
          {
            type: "customer::created",
            map: () => data.map((c) => ({ customerId: c.id, data: c })),
          },
        ],
        webhooks: { organizationId, environment, triggers: [{ event: "customer.created", map: () => data }] },
      };
    }
  );
};

type CustomerLookup = { id: string } | { email: string } | { phone: string };

export const retrieveCustomers = async (params?: MaybeArray<CustomerLookup>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const lookupArray = Array.isArray(params) ? params : params ? [params] : [];

  const ids = lookupArray.filter((p): p is { id: string } => "id" in p).map((p) => p.id);
  const emails = lookupArray.filter((p): p is { email: string } => "email" in p).map((p) => p.email);
  const phones = lookupArray.filter((p): p is { phone: string } => "phone" in p).map((p) => p.phone);

  const orFilters: SQL[] = [];
  if (ids.length) orFilters.push(inArray(customers.id, ids));
  if (emails.length) orFilters.push(inArray(customers.email, emails));
  if (phones.length) orFilters.push(inArray(customers.phone, phones));

  const result = await db
    .select()
    .from(customers)
    .where(and(or(...orFilters), eq(customers.organizationId, organizationId), eq(customers.environment, environment)));

  return result ?? null;
};

export const putCustomer = async (id: string, retUpdate: Partial<Customer>, orgId?: string, env?: Network) => {
  const [{ organizationId, environment }, [oldCustomer]] = await Promise.all([
    resolveOrgContext(orgId, env),
    retrieveCustomers({ id }, orgId, env),
  ]);

  return withEvent(
    async () => {
      const [customer] = await db
        .update(customers)
        .set({ ...retUpdate, updatedAt: new Date() })
        .where(
          and(
            eq(customers.id, id),
            eq(customers.organizationId, organizationId),
            eq(customers.environment, environment)
          )
        )
        .returning();

      if (!customer) throw new Error("Customer not found");

      return customer;
    },
    {
      events: [
        {
          type: "customer::updated",
          map: (newCustomer) => ({
            customerId: newCustomer.id,
            data: { $changes: computeDiff(oldCustomer ?? {}, newCustomer) },
          }),
        },
      ],
      webhooks: {
        organizationId,
        environment,
        triggers: [
          {
            event: "customer.updated",
            map: (newCustomer) => ({
              customerId: newCustomer.id,
              data: { $changes: computeDiff(oldCustomer ?? {}, newCustomer) },
            }),
          },
        ],
      },
    }
  );
};

export const deleteCustomer = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return withEvent(
    async () => {
      const [customer] = await db
        .delete(customers)
        .where(
          and(
            eq(customers.id, id),
            eq(customers.organizationId, organizationId),
            eq(customers.environment, environment)
          )
        )
        .returning();

      if (!customer) throw new Error("Customer not found");

      return customer;
    },
    {
      events: [],
      webhooks: {
        organizationId,
        environment,
        triggers: [{ event: "customer.deleted", map: (customer) => ({ id: customer.id, deleted: true }) }],
      },
    }
  );
};
