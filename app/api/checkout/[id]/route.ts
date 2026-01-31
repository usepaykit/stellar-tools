import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { deleteCheckout, putCheckout, retrieveCheckout } from "@/actions/checkout";
import { updateCheckoutSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);

  const checkout = await retrieveCheckout(id, organizationId, environment);

  return NextResponse.json({ data: checkout });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);

  const { error, data } = updateCheckoutSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const checkout = await putCheckout(id, data, organizationId, environment);

  return NextResponse.json({ data: checkout });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);

  await deleteCheckout(id, organizationId, environment);

  return NextResponse.json({ data: null });
};
