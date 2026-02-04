"use server";

import { resolveOrgContext } from "@/actions/organization";
import { Network, TeamInvite, accounts, db, organizations, teamInvites } from "@/db";
import { generateResourceId } from "@/lib/utils";
import { and, eq, sql } from "drizzle-orm";
import moment from "moment";

export const postTeamInvite = async (
  params: Omit<TeamInvite, "id" | "organizationId" | "environment" | "expiresAt" | "status">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId } = await resolveOrgContext(orgId, env);

  const [teamInvite] = await db
    .insert(teamInvites)
    .values({
      ...params,
      id: generateResourceId("ti", organizationId, 25),
      expiresAt: moment().add(7, "days").toDate(),
      status: "pending",
      organizationId,
    })
    .returning();

  return teamInvite;
};

export const retrieveTeamInvites = async (orgId?: string, env?: Network) => {
  const { organizationId } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(teamInvites)
    .where(and(eq(teamInvites.organizationId, organizationId)));
};

export const retrieveTeamInvite = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId } = await resolveOrgContext(orgId, env);

  const [teamInvite] = await db
    .select()
    .from(teamInvites)
    .where(and(eq(teamInvites.id, id), eq(teamInvites.organizationId, organizationId)))
    .limit(1);

  if (!teamInvite) throw new Error("Team invite not found");

  return teamInvite;
};

export const retrieveTeamInviteByOrg = async (orgId: string, inviteId: string) => {
  const [result] = await db
    .select({
      id: teamInvites.id,
      organizationName: organizations.name,
      organizationLogo: organizations.logoUrl,
      email: teamInvites.email,
      status: teamInvites.status,
      expiresAt: teamInvites.expiresAt,
      role: teamInvites.role,
      inviterName:
        sql<string>`NULLIF(CONCAT(${accounts.profile}->>'firstName', ' ', ${accounts.profile}->>'lastName'), ' ')`.as(
          "inviter_name"
        ),
    })
    .from(teamInvites)
    .innerJoin(organizations, eq(teamInvites.organizationId, organizations.id))
    .innerJoin(accounts, eq(organizations.accountId, accounts.id))
    .where(and(eq(teamInvites.organizationId, orgId), eq(teamInvites.id, inviteId)))
    .limit(1);

  if (!result) return null;

  return result;
};

export const putTeamInvite = async (id: string, params: Partial<TeamInvite>, orgId?: string, env?: Network) => {
  const { organizationId } = await resolveOrgContext(orgId, env);

  const [teamInvite] = await db
    .update(teamInvites)
    .set({ ...params, updatedAt: new Date() })
    .where(and(eq(teamInvites.id, id), eq(teamInvites.organizationId, organizationId)))
    .returning();

  if (!teamInvite) throw new Error("Team invite not found");

  return teamInvite;
};

export const deleteTeamInvite = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId } = await resolveOrgContext(orgId, env);

  await db
    .delete(teamInvites)
    .where(and(eq(teamInvites.id, id), eq(teamInvites.organizationId, organizationId)))
    .returning();

  return null;
};
