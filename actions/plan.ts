"use server";

import { getCurrentUser } from "@/actions/auth";
import { Network, accounts, db, plan } from "@/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable } from "drizzle-orm/pg-core";

export const retrievePlans = async () => {
  return await db.select().from(plan).orderBy(desc(plan.customers));
};

export const retrieveAccountPlan = async (accId?: string) => {
  const accountId = accId ? accId : (await getCurrentUser())?.id;

  if (!accountId) return null;

  return await db
    .select({
      account: accounts,
      plan: plan,
    })
    .from(accounts)
    .leftJoin(
      plan,
      eq(
        plan.id,
        // Fallback to the cheapest aka "FREE" plan ID  directly in the JOIN condition
        sql`COALESCE(${accounts.planId}, (SELECT ${plan.id} FROM ${plan} ORDER BY ${plan.customers} ASC LIMIT 1))`
      )
    )
    .where(eq(accounts.id, accountId))
    .limit(1)
    .then(([accountPlan]) => ({ plan: accountPlan?.plan! }));
};

type GatedTable = AnyPgTable & {
  organizationId: AnyPgColumn;
  environment: AnyPgColumn | null;
};

export const validateLimit = async <T extends GatedTable>(
  table: T,
  limit: number,
  orgId: string,
  env: Network,
  domainName: string
) => {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as integer)` })
    .from(table as AnyPgTable)
    .where(and(eq(table.organizationId, orgId), ...(table.environment ? [eq(table.environment, env)] : [])));

  const count = result?.count ?? 0;

  if (count >= limit) {
    throw new Error(`Plan limit reached: [${domainName}]. Current usage: ${count}/${limit}.`);
  }
};
