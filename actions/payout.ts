"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { Network, Payout, db, payouts } from "@/db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postPayout = async (
  params: Omit<Payout, "organizationId" | "environment" | "createdAt" | "updatedAt">,
  orgId?: string,
  env?: Network
) => {
  return withEvent(
    async () => {
      const { organizationId, environment } = await resolveOrgContext(orgId, env);

      const [result] = await db
        .insert(payouts)
        .values({ ...params, organizationId, environment })
        .returning();

      return result;
    },
    {
      events: [
        {
          type: "payout::requested",
          map: (payout) => ({
            merchantId: payout.organizationId,
            data: { amount: payout.amount, walletAddress: payout.walletAddress, memo: payout.memo },
          }),
        },
      ],
    }
  );
};

export const putPayout = async (id: string, params: Partial<Payout>) => {
  return withEvent(
    async () => {
      const [payout] = await db.update(payouts).set(params).where(eq(payouts.id, id)).returning();
      return payout;
    },
    {
      events: [
        {
          type: "payout::processed",
          map: (payout) => ({
            merchantId: payout.organizationId,
            data: {
              amount: payout.amount,
              walletAddress: payout.walletAddress,
              memo: payout.memo,
              transactionHash: payout.transactionHash,
            },
          }),
        },
      ],
    }
  );
};
