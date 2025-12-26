"use server";

import { Account, accounts, db } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postAccount = async (params: Partial<Account>) => {
  const [account] = await db
    .insert(accounts)
    .values({ id: `ac_${nanoid(25)}`, ...params } as Account)
    .returning();

  return account;
};

export const retrieveAccount = async (
  payload: { id: string } | { email: string }
) => {
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      "id" in payload
        ? eq(accounts.id, payload.id)
        : eq(accounts.email, payload.email as string)
    )
    .limit(1);

  if (!account) throw new Error("Account not found");

  return account;
};

export const putAccount = async (id: string, params: Partial<Account>) => {
  const [account] = await db
    .update(accounts)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(accounts.id, id))
    .returning();

  if (!account) throw new Error("Account not found");

  return account;
};

export const deleteAccount = async (id: string) => {
  await db.delete(accounts).where(eq(accounts.id, id)).returning();

  return null;
};
