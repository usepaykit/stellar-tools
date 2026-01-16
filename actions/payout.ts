"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import { Network, Payout, db, payouts } from "@/db";
import { nanoid } from "nanoid";

export const postPayouts = async (
  params: Omit<Payout, "id" | "organizationId" | "environment">[],
  orgId?: string,
  env?: Network
) => {
  return withEvent(
    async () => {
      const { organizationId, environment } = await resolveOrgContext(orgId, env);

      const [result] = await db
        .insert(payouts)
        .values(params.map((p) => ({ ...p, id: `pay_${nanoid(25)}`, organizationId, environment })))
        .returning();

      return result;
    },
    {
      type: "payout::requested",
      map: (payout) => ({
        merchantId: payout.organizationId,
        data: { amount: payout.amount, walletAddress: payout.walletAddress, memo: payout.memo },
      }),
    }
  );
};
