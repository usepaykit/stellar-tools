import { validateLimit } from "@/actions/plan";
import { CreditBalance, CreditTransaction, Network, creditBalances, creditTransactions, db } from "@/db";
import { generateResourceId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

export const postCreditBalance = async (
  params: Omit<CreditBalance, "id" | "organizationId" | "environment">,
  orgId: string,
  env: Network,
  options?: { creditBalanceCount?: number }
) => {
  await validateLimit(creditBalances, options?.creditBalanceCount ?? 0, orgId, env, "credit balances");

  return await db
    .insert(creditBalances)
    .values({ id: generateResourceId("cb", orgId, 25), organizationId: orgId, environment: env, ...params })
    .returning()
    .then(([creditBalance]) => creditBalance);
};

export const retrieveCreditBalance = async (customerId: string, productId: string, organizationId: string) => {
  return await db
    .select()
    .from(creditBalances)
    .where(
      and(
        eq(creditBalances.customerId, customerId),
        eq(creditBalances.productId, productId),
        eq(creditBalances.organizationId, organizationId)
      )
    )
    .limit(1)
    .then(([creditBalance]) => creditBalance);
};

export const retrieveCreditBalanceById = async (id: string) => {
  return await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.id, id))
    .limit(1)
    .then(([creditBalance]) => creditBalance);
};

export const putCreditBalance = async (id: string, retUpdate: Partial<CreditBalance>) => {
  return await db
    .update(creditBalances)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(eq(creditBalances.id, id))
    .returning()
    .then(([record]) => record);
};

export const deleteCreditBalance = async (id: string) => {
  return await db
    .delete(creditBalances)
    .where(eq(creditBalances.id, id))
    .returning()
    .then(() => null);
};

// TRANSACTIONS

export const postCreditTransaction = async (
  params: Omit<CreditTransaction, "id" | "organizationId" | "createdAt" | "updatedAt">,
  organizationId: string,
  env: Network
) => {
  return await db
    .insert(creditTransactions)
    .values({
      ...params,
      id: generateResourceId("ct", organizationId, 25),
      organizationId: organizationId,
      environment: env,
    })
    .returning()
    .then(([creditTransaction]) => creditTransaction);
};

export const retrieveCreditTransaction = async (id: string, organizationId: string) => {
  return await db
    .select()
    .from(creditTransactions)
    .where(and(eq(creditTransactions.id, id), eq(creditTransactions.organizationId, organizationId)))
    .limit(1)
    .then(([creditTransaction]) => creditTransaction);
};

export const putCreditTransaction = async (id: string, returnUpdate: Partial<CreditTransaction>) => {
  return await db
    .update(creditTransactions)
    .set({ ...returnUpdate, updatedAt: new Date() })
    .where(eq(creditTransactions.id, id))
    .returning()
    .then(([record]) => record);
};

export const deleteCreditTransaction = async (id: string) => {
  return await db
    .delete(creditTransactions)
    .where(eq(creditTransactions.id, id))
    .returning()
    .then(() => null);
};
