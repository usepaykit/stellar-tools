import { resolveApiKey } from "@/actions/apikey";
import {
  deleteCustomer,
  putCustomer,
  retrieveCustomer,
} from "@/actions/customers";
import { Customer } from "@/db";
import { schemaFor } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const { organizationId } = await resolveApiKey(apiKey);

  const customer = await retrieveCustomer(customerId, organizationId);

  return NextResponse.json({ data: customer });
};

const putCustomerSchema = schemaFor<Partial<Customer>>()(
  z.object({
    email: z.email().optional(),
    phone: z.string().optional(),
    name: z.string().optional(),
  })
);

export const PUT = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const { organizationId } = await resolveApiKey(apiKey);

  const { error, data } = putCustomerSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const customer = await putCustomer(customerId, organizationId, data);

  return NextResponse.json({ data: customer });
};

export const DELETE = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const { organizationId } = await resolveApiKey(apiKey);

  await deleteCustomer(customerId, organizationId);

  return NextResponse.json({ data: null });
};
