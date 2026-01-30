"use server";

import { db, waitlist } from "@/db";
import { nanoid } from "nanoid";

export const postWaitlist = async (params: { email: string; phoneNumber?: string }) => {
  const [entry] = await db
    .insert(waitlist)
    .values({
      id: `wl_${nanoid(25)}`,
      email: params.email.toLowerCase(),
      phoneNumber: params.phoneNumber || null,
    })
    .returning();

  if (!entry) throw new Error("Failed to join waitlist");

  return entry;
};
