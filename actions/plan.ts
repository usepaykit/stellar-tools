"use server";

import { getCurrentUser } from "@/actions/auth";
import { Network, accounts, db, organizations, plan } from "@/db";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { AnyPgColumn, AnyPgTable, getTableConfig } from "drizzle-orm/pg-core";

export const retrievePlans = async () => {
  return await db.select().from(plan).orderBy(desc(plan.customers));
};

export const retrievePlan = async (id: string) => {
  return await db
    .select()
    .from(plan)
    .where(eq(plan.id, id))
    .limit(1)
    .then(([plan]) => plan);
};

export const retrieveOwnerPlan = async (filter: { accId?: string; orgId?: string; currentUser?: boolean }) => {
  let accountId: string | undefined;

  if (filter.accId) {
    accountId = filter.accId;
  } else if (filter.orgId) {
    const [org] = await db
      .select({ accountId: organizations.accountId })
      .from(organizations)
      .where(eq(organizations.id, filter.orgId))
      .limit(1);
    accountId = org.accountId;
  } else if (filter.currentUser) {
    accountId = (await getCurrentUser())?.id;
  } else {
    throw new Error("No account or organization ID provided");
  }

  return await db
    .select({ account: { id: accounts.id }, plan })
    .from(accounts)
    .leftJoin(plan, eq(accounts.planId, plan.id))
    .where(accountId ? eq(accounts.id, accountId) : undefined)
    .limit(1)
    .then(([accountPlan]) => ({ plan: accountPlan?.plan! }));
};

// -- VALIDATE LIMITS --

/**
* A. The "Throughput" Gates (Resets every month)
*    These are actions that we charge for the work our server does.
*    `payments`: You can process 10,000 payments this month.
*    `billing_events`: You can send 10,000 webhooks this month.
*    `usage_records`: You can log 50,000 API calls this month.

* B. The "Capacity" Gates (High-Water Mark)
*    These are assets that we charge for the value stored in your system. If they delete a customer, they get that "slot" back.
*    `customers`: You can manage 5,000 total customers.
*    `subscriptions`: You can have 1,000 active subscriptions.
*    `products`: You can have 100 total products.
 */

/**
 * Senior Tip: Use a more flexible type for GatedTable
 * to handle different column names across different tables.
 */
type GatedTable = AnyPgTable & {
  organizationId: AnyPgColumn;
  createdAt: AnyPgColumn;
  environment?: AnyPgColumn | null;
};

export interface GatingCheck {
  domain: string;
  table: GatedTable;
  limit: number;
  type: "capacity" | "throughput";
}

export const validateLimits = async (
  orgId: string,
  env: Network,
  checks: GatingCheck[],
  options: { throwOnError?: boolean } = { throwOnError: true }
) => {
  if (checks.length === 0) return {};

  const startOfCycle = new Date();
  startOfCycle.setUTCDate(1);
  startOfCycle.setUTCHours(0, 0, 0, 0);

  const selectShape = checks.reduce(
    (acc, check, index) => {
      const table = check.table;
      const { name: tableName } = getTableConfig(table);

      const filters = [
        eq(table.organizationId, orgId),
        table.environment ? eq(table.environment, env) : undefined,
      ].filter(Boolean);

      if (check.type === "throughput") {
        filters.push(gte(table.createdAt, startOfCycle));
      }

      acc[`check_${index}`] = sql<number>`(
      SELECT count(*)::int 
      FROM ${sql.identifier(tableName)} 
      WHERE ${and(...filters)}
    )`;

      return acc;
    },
    {} as Record<string, any>
  );

  const [results] = await db.select(selectShape).from(sql`(SELECT 1) as dummy`);

  const violations: string[] = [];
  const usageStats: Record<string, number> = {};

  checks.forEach((check, index) => {
    const currentUsage = Number(results[`check_${index}`]) || 0;
    usageStats[check.domain] = currentUsage;

    if (currentUsage >= check.limit) {
      violations.push(`${check.domain} (${currentUsage}/${check.limit})`);
    }
  });

  if (options.throwOnError && violations.length > 0) {
    throw new Error(`Plan limits reached: ${violations.join(", ")}. Please upgrade.`);
  }

  return usageStats;
};
