import { resolveApiKey } from "@/actions/apikey";
import { deleteCustomer, putCustomer, retrieveCustomer } from "@/actions/customers";
import { updateCustomerSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const customer = await retrieveCustomer({ id: customerId }, organizationId, environment);

  return NextResponse.json({ data: customer });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const { error, data } = updateCustomerSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const customer = await putCustomer(customerId, data, organizationId, environment);

  return NextResponse.json({ data: customer });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const { organizationId, environment } = await resolveApiKey(apiKey);

  await deleteCustomer(customerId, organizationId, environment);

  return NextResponse.json({ data: null });
};
