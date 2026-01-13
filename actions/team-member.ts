"use server";

import { TeamMember, db, teamMembers } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postTeamMember = async (params: Partial<TeamMember>) => {
  const [teamMember] = await db
    .insert(teamMembers)
    .values({ id: `tm_${nanoid(25)}`, ...params } as TeamMember)
    .returning();

  return teamMember;
};

export const retrieveTeamMembers = async (organizationId: string) => {
  return await db.select().from(teamMembers).where(eq(teamMembers.organizationId, organizationId));
};

export const retrieveTeamMember = async (id: string, organizationId: string) => {
  const [teamMember] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.id, id), eq(teamMembers.organizationId, organizationId)))
    .limit(1);

  if (!teamMember) throw new Error("Team member not found");

  return teamMember;
};

export const putTeamMember = async (
  id: string,
  organizationId: string,
  params: Partial<TeamMember>
) => {
  const [teamMember] = await db
    .update(teamMembers)
    .set({ ...params, updatedAt: new Date() })
    .where(and(eq(teamMembers.id, id), eq(teamMembers.organizationId, organizationId)))
    .returning();

  if (!teamMember) throw new Error("Team member not found");

  return teamMember;
};

export const deleteTeamMember = async (id: string, organizationId: string) => {
  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.id, id), eq(teamMembers.organizationId, organizationId)))
    .returning();

  return null;
};
