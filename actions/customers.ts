"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { Customer, Network, customers, db } from "@/db";
import { computeDiff } from "@/lib/utils";
import { SQL, and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postCustomers = async (
  params: Omit<Customer, "id" | "organizationId" | "environment">[],
  orgId?: string,
  env?: Network
) => {
  return withEvent(
    async () => {
      const { organizationId, environment } = await resolveOrgContext(orgId, env);

      const [result] = await db
        .insert(customers)
        .values(params.map((p) => ({ ...p, id: `cus_${nanoid(25)}`, organizationId, environment })))
        .returning();

      return result;
    },
    {
      type: "customer::created",
      map: (customer) => ({
        customerId: customer.id,
        data: {
          name: customer.name,
          email: customer.email,
          metadata: JSON.stringify(customer.metadata),
        },
      }),
    }
  );
};

export const upsertCustomer = async (params: Partial<Customer>, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let whereClause: SQL<unknown>;

  if (!params) {
    throw new Error("Invalid customer identifier");
  }

  if (params?.id) {
    whereClause = eq(customers.id, params.id);
  } else if (params?.email) {
    whereClause = eq(customers.email, params.email);
  } else if (params?.phone) {
    whereClause = sql`${customers.phone} = ${params.phone}` as unknown as SQL<unknown>;
  } else {
    throw new Error("Invalid customer identifier");
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        whereClause,
        eq(customers.organizationId, organizationId),
        eq(customers.environment, environment)
      )
    )
    .limit(1);

  if (customer) {
    await putCustomer(customer.id, params, organizationId, environment);
    return customer;
  } else {
    return await postCustomers([params as Customer], organizationId, environment);
  }
};

export const retrieveCustomers = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.organizationId, organizationId), eq(customers.environment, environment))
    );
};

export const retrieveCustomer = async (
  params: { id: string } | { email: string } | { phone: string } | undefined,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let whereClause: SQL<unknown>;

  if (!params) {
    throw new Error("Invalid customer identifier");
  }

  if ("id" in params) {
    whereClause = eq(customers.id, params.id);
  } else if ("email" in params) {
    whereClause = eq(customers.email, params.email);
  } else if ("phone" in params) {
    whereClause = sql`${customers.phone} = ${params.phone}` as unknown as SQL<unknown>;
  } else {
    throw new Error("Invalid customer identifier");
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        whereClause,
        eq(customers.organizationId, organizationId),
        eq(customers.environment, environment)
      )
    )
    .limit(1);

  if (!customer) throw new Error("Customer not found");

  return customer;
};

export const putCustomer = async (
  id: string,
  retUpdate: Partial<Customer>,
  orgId?: string,
  env?: Network
) => {
  return withEvent(
    async () => {
      const { organizationId, environment } = await resolveOrgContext(orgId, env);

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
      type: "customer::updated",
      map: (customer) => ({
        customerId: customer.id,
        data: { $changes: computeDiff(customer, retUpdate) },
      }),
    }
  );
};

export const deleteCustomer = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(customers)
    .where(
      and(
        eq(customers.id, id),
        eq(customers.organizationId, organizationId),
        eq(customers.environment, environment)
      )
    )
    .returning();

  return null;
};
