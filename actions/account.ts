"use server";

import { Account, AuthProvider, accounts, db } from "@/db";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getCurrentUser } from "./auth";

export const postAccount = async (params: Partial<Account>) => {
  const [account] = await db
    .insert(accounts)
    .values({ id: `ac_${nanoid(25)}`, ...params } as Account)
    .returning();

  return account;
};

export const retrieveAccount = async (
  payload:
    | { id: string }
    | { email: string }
    | { sso: { provider: AuthProvider; sub: string } }
): Promise<Account | null> => {
  let whereClause;

  if ("sso" in payload) {
    whereClause = sql`EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(${accounts.sso}->'values') AS element 
      WHERE element->>'provider' = ${payload.sso.provider}::text 
        AND element->>'sub' = ${payload.sso.sub}::text
    )`;
  } else if ("id" in payload) {
    whereClause = eq(accounts.id, payload.id);
  } else {
    whereClause = eq(accounts.email, payload.email);
  }

  const [account] = await db
    .select()
    .from(accounts)
    .where(whereClause)
    .limit(1);

  return account || null;
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

// -- Account Internal --

export const resolveAccountContext = async (accountId?: string) => {
  if (accountId) return { accountId };

  const account = await getCurrentUser();

  if (!account) throw new Error("Account not found");

  return { accountId: account.id };
};
