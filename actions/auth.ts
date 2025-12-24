"use server";

import { Auth, auth, db } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postAuth = async (params: Partial<Auth>) => {
  const [response] = await db
    .insert(auth)
    .values({ id: `au_${nanoid(25)}`, ...params } as Auth)
    .returning();

  if (!response) throw new Error("Failed to create auth");

  return response;
};

export const retieveAuth = async (id: string) => {
  const [response] = await db
    .select()
    .from(auth)
    .where(eq(auth.id, id))
    .limit(1);

  if (!response) throw new Error("Auth not found");

  return response;
};

export const putAuth = async (id: string, params: Partial<Auth>) => {
  const [response] = await db
    .update(auth)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(auth.id, id))
    .returning();

  if (!response) throw new Error("Failed to update auth");

  return response;
};

export const deleteAuth = async (id: string) => {
  const [response] = await db.delete(auth).where(eq(auth.id, id)).returning();

  if (!response) throw new Error("Failed to delete auth");

  return response;
};
