"use server";

import { TeamMember, db, teamMembers } from "@/db";
import { generateResourceId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

export const postTeamMember = async (
  params: Omit<TeamMember, "id" | "createdAt" | "updatedAt" | "organizationId">,
  organizationId: string
) => {
  return await db
    .insert(teamMembers)
    .values({ ...params, id: generateResourceId("tm", organizationId, 25), organizationId })
    .returning()
    .then(([teamMember]) => teamMember);
};

export const retrieveTeamMembers = async (organizationId: string) => {
  return await db.select().from(teamMembers).where(eq(teamMembers.organizationId, organizationId));
};

export const retrieveTeamMember = async (id: string, organizationId: string) => {
  return await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.id, id), eq(teamMembers.organizationId, organizationId)))
    .limit(1)
    .then(([teamMember]) => teamMember);
};

export const putTeamMember = async (id: string, organizationId: string, params: Partial<TeamMember>) => {
  return await db
    .update(teamMembers)
    .set({ ...params, updatedAt: new Date() })
    .where(and(eq(teamMembers.id, id), eq(teamMembers.organizationId, organizationId)))
    .returning()
    .then(([teamMember]) => teamMember);
};

export const deleteTeamMember = async (id: string, organizationId: string) => {
  return await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.id, id), eq(teamMembers.organizationId, organizationId)))
    .returning()
    .then(() => null);
};
