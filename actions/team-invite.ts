"use server";

import { Network, TeamInvite, db, teamInvites } from "@/db";
import { and, eq } from "drizzle-orm";
import moment from "moment";
import { nanoid } from "nanoid";

import { resolveOrgContext } from "./organization";

export const postTeamInvite = async (
  params: Omit<
    TeamInvite,
    "id" | "organizationId" | "environment" | "expiresAt" | "status"
  >,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [teamInvite] = await db
    .insert(teamInvites)
    .values({
      ...params,
      id: `ti_${nanoid(25)}`,
      expiresAt: moment().add(7, "days").toDate(),
      status: "pending",
      organizationId,
      environment,
    })
    .returning();

  return teamInvite;
};

export const retrieveTeamInvites = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  return await db
    .select()
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.organizationId, organizationId),
        eq(teamInvites.environment, environment)
      )
    );
};

export const retrieveTeamInvite = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [teamInvite] = await db
    .select()
    .from(teamInvites)
    .where(
      and(
        eq(teamInvites.id, id),
        eq(teamInvites.organizationId, organizationId),
        eq(teamInvites.environment, environment)
      )
    )
    .limit(1);

  if (!teamInvite) throw new Error("Team invite not found");

  return teamInvite;
};

export const putTeamInvite = async (
  id: string,
  params: Partial<TeamInvite>,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [teamInvite] = await db
    .update(teamInvites)
    .set({ ...params, updatedAt: new Date() })
    .where(
      and(
        eq(teamInvites.id, id),
        eq(teamInvites.organizationId, organizationId),
        eq(teamInvites.environment, environment)
      )
    )
    .returning();

  if (!teamInvite) throw new Error("Team invite not found");

  return teamInvite;
};

export const deleteTeamInvite = async (
  id: string,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  await db
    .delete(teamInvites)
    .where(
      and(
        eq(teamInvites.id, id),
        eq(teamInvites.organizationId, organizationId),
        eq(teamInvites.environment, environment)
      )
    )
    .returning();

  return null;
};
