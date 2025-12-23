import { resolveApiKey } from "@/actions/apikey";
import { deleteWebhook, putWebhook, retrieveWebhook } from "@/actions/webhook";
import { Webhook } from "@/db";
import { schemaFor } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  const webhook = await retrieveWebhook(id, organizationId);

  return NextResponse.json({ data: webhook });
};

const putWebhookSchema = schemaFor<Partial<Webhook>>()(
  z.object({
    url: z.string().optional(),
    events: z.array(z.string()).optional(),
    isDisabled: z.boolean().default(false).optional(),
    name: z.string().optional(),
    description: z.string().optional(),
  })
);

export const PUT = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { error, data } = putWebhookSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId } = await resolveApiKey(apiKey);

  const webhook = await putWebhook(id, organizationId, data);

  return NextResponse.json({ data: webhook });
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  await deleteWebhook(id, organizationId);

  return NextResponse.json({ data: null });
};
