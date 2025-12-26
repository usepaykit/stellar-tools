"use server";

import { Customer, Network, customers, db } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postCustomer = async (params: Partial<Customer>) => {
  const [customer] = await db
    .insert(customers)
    .values({ id: `cu_${nanoid(25)}`, ...params } as Customer)
    .returning();

  if (!customer) throw new Error("Customer not created");

  return customer;
};

export const retrieveCustomers = async (
  organizationId: string,
  environment: Network
) => {
  return await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.organizationId, organizationId),
        eq(customers.environment, environment)
      )
    );
};

export const retrieveCustomer = async (id: string, organizationId: string) => {
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.id, id), eq(customers.organizationId, organizationId))
    )
    .limit(1);

  if (!customer) throw new Error("Customer not found");

  return customer;
};

export const putCustomer = async (
  id: string,
  organizationId: string,
  retUpdate: Partial<Customer>
) => {
  const [customer] = await db
    .update(customers)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(
      and(eq(customers.id, id), eq(customers.organizationId, organizationId))
    )
    .returning();

  if (!customer) throw new Error("Customer not found");

  return customer;
};

export const deleteCustomer = async (id: string, organizationId: string) => {
  await db
    .delete(customers)
    .where(
      and(eq(customers.id, id), eq(customers.organizationId, organizationId))
    )
    .returning();

  return null;
};
