"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { validateLimit } from "@/actions/plan";
import { Customer, CustomerMetadata, Network, ResolvedCustomer, customerWallets, customers, db } from "@/db";
import { computeDiff, generateResourceId } from "@/lib/utils";
import { MaybeArray } from "@stellartools/core";
import { SQL, and, eq, inArray, or } from "drizzle-orm";

export const postCustomers = async (
  params: Omit<Customer, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt">[],
  orgId?: string,
  env?: Network,
  options?: { source?: string; customerCount?: number }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await validateLimit(customers, options?.customerCount ?? 0, organizationId, environment, "customers");

  return withEvent(
    async () => {
      const results = await db
        .insert(customers)
        .values(
          params.map((p) => ({ ...p, id: generateResourceId("cus", organizationId, 25), organizationId, environment }))
        )
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

type CustomerLookup = { id?: string } | { email?: string } | { phone?: string };

export const retrieveCustomers = async (
  params?: MaybeArray<CustomerLookup>,
  options?: { withWallets?: boolean },
  orgId?: string,
  env?: Network
): Promise<ResolvedCustomer[]> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const lookupArray = Array.isArray(params) ? params : params ? [params] : [];
  const ids = lookupArray.filter((p): p is { id: string } => "id" in p).map((p) => p.id);
  const emails = lookupArray.filter((p): p is { email: string } => "email" in p).map((p) => p.email);
  const phones = lookupArray.filter((p): p is { phone: string } => "phone" in p).map((p) => p.phone);

  const orFilters: (SQL | undefined)[] = [];
  if (ids.length) orFilters.push(inArray(customers.id, ids));
  if (emails.length) orFilters.push(inArray(customers.email, emails));
  if (phones.length) orFilters.push(inArray(customers.phone, phones));

  const rows = await db
    .select({
      customer: customers,
      wallet: customerWallets,
    })
    .from(customers)
    .leftJoin(customerWallets, eq(customers.id, customerWallets.customerId))
    .where(
      and(
        orFilters.length ? or(...orFilters.filter((f): f is SQL => !!f)) : undefined,
        eq(customers.organizationId, organizationId),
        eq(customers.environment, environment)
      )
    );

  const customerMap = new Map<string, ResolvedCustomer>();

  for (const { customer, wallet } of rows) {
    if (!customerMap.has(customer.id)) {
      customerMap.set(customer.id, {
        ...customer,
        ...(options?.withWallets && { wallets: [] }),
      });
    }

    if (options?.withWallets && wallet) {
      const entry = customerMap.get(customer.id);
      entry?.wallets?.push(wallet);
    }
  }

  return Array.from(customerMap.values());
};

export const putCustomer = async (id: string, retUpdate: Partial<Customer>, orgId?: string, env?: Network) => {
  const [{ organizationId, environment }, [oldCustomer]] = await Promise.all([
    resolveOrgContext(orgId, env),
    retrieveCustomers({ id }, undefined, orgId, env),
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
            data: { $changes: computeDiff(oldCustomer ?? {}, newCustomer, undefined, ".") },
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

export const upsertCustomer = async (
  params: MaybeArray<CustomerLookup & { name: string; metadata: CustomerMetadata }>,
  orgId: string,
  env: Network
) => {
  const lookupArray = Array.isArray(params) ? params : params ? [params] : [];

  const existing = await retrieveCustomers(
    lookupArray.map((p) => ({
      id: "id" in p ? p.id : undefined,
      email: "email" in p ? p.email : undefined,
      phone: "phone" in p ? p.phone : undefined,
    })),
    undefined,
    orgId,
    env
  ).then(([c]) => c);

  if (existing) return existing;

  return await postCustomers(
    [
      {
        email: lookupArray.filter((p) => "email" in p).map((p) => ("email" in p ? p.email : undefined))[0] ?? null,
        name: lookupArray.filter((p) => "name" in p).map((p) => p.name)[0] ?? null,
        phone: null,
        metadata: lookupArray.filter((p) => "metadata" in p).map((p) => p.metadata)[0] ?? null,
      },
    ],
    orgId,
    env
  ).then(([c]) => c);
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
