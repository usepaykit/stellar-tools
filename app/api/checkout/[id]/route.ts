import { resolveApiKey } from "@/actions/apikey";
import {
  deleteCheckout,
  putCheckout,
  retrieveCheckout,
} from "@/actions/checkout";
import { Checkout, checkoutStatusEnum } from "@/db";
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

  const checkout = await retrieveCheckout(id, organizationId);

  return NextResponse.json({ data: checkout });
};

const putCheckoutSchema = schemaFor<Partial<Checkout>>()(
  z.object({
    status: z.enum(checkoutStatusEnum.enumValues),
    metadata: z.record(z.string(), z.any()).default({}),
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

  const { organizationId } = await resolveApiKey(apiKey);

  const { error, data } = putCheckoutSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const checkout = await putCheckout(id, organizationId, data);

  return NextResponse.json({ data: checkout });
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

  await deleteCheckout(id, organizationId);

  return NextResponse.json({ data: null });
};
