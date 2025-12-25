import {
  CreditBalance,
  CreditTransaction,
  creditBalances,
  creditTransactions,
  db,
} from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postCreditBalance = async (params: Partial<CreditBalance>) => {
  const [creditBalance] = await db
    .insert(creditBalances)
    .values({ id: `cb_${nanoid(25)}`, ...params } as CreditBalance)
    .returning();

  return creditBalance;
};

export const retrieveCreditBalance = async (id: string) => {
  const [creditBalance] = await db
    .select()
    .from(creditBalances)
    .where(eq(creditBalances.id, id))
    .limit(1);

  if (!creditBalance) throw new Error("Credit balance not found");

  return creditBalance;
};

export const putCreditBalance = async (
  id: string,
  retUpdate: Partial<CreditBalance>
) => {
  const [record] = await db
    .update(creditBalances)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(eq(creditBalances.id, id))
    .returning();

  if (!record) throw new Error("Record not found");

  return record;
};

export const deleteCreditBalance = async (id: string) => {
  await db.delete(creditBalances).where(eq(creditBalances.id, id)).returning();

  return null;
};

// TRANSACTIONS

export const postCreditTransaction = async (
  params: Partial<CreditTransaction>
) => {
  const [creditTransaction] = await db
    .insert(creditTransactions)
    .values({ id: `ct_${nanoid(25)}`, ...params } as CreditTransaction)
    .returning();

  return creditTransaction;
};

export const retrieveCreditTransaction = async (id: string) => {
  const [creditTransaction] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.id, id))
    .limit(1);

  if (!creditTransaction) throw new Error("Credit transaction not found");

  return creditTransaction;
};

export const putCreditTransaction = async (
  id: string,
  returnUpdate: Partial<CreditTransaction>
) => {
  const [record] = await db
    .update(creditTransactions)
    .set({ ...returnUpdate, updatedAt: new Date() })
    .where(eq(creditTransactions.id, id))
    .returning();

  if (!record) throw new Error("Record not found");

  return record;
};

export const deleteCreditTransaction = async (id: string) => {
  await db
    .delete(creditTransactions)
    .where(eq(creditTransactions.id, id))
    .returning();

  return null;
};
