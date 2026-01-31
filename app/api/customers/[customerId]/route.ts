import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { deleteCustomer, putCustomer, retrieveCustomers } from "@/actions/customers";
import { updateCustomerSchema } from "@stellartools/core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), context.params),
    async ({ customerId }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
      const [customer] = await retrieveCustomers({ id: customerId }, organizationId, environment);
      return Result.ok(customer);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { customerId } = await context.params;

  const result = await Result.andThenAsync(validateSchema(updateCustomerSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
    const customer = await putCustomer(customerId, data, organizationId, environment);
    return Result.ok(customer);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), context.params),
    async ({ customerId }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
      await deleteCustomer(customerId, organizationId, environment);
      return Result.ok(null);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
