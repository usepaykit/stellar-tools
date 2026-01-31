import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { Result, z as Schema, createCustomerSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const result = await Result.andThenAsync(validateSchema(createCustomerSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
    const [customer] = await postCustomers(
      [{ ...data, walletAddresses: null, phone: data?.phone ?? null }],
      organizationId,
      environment,
      { source: "API" }
    );
    return Result.ok(customer);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};

export const GET = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ organizationId: Schema.string() }), req.json()),
    async (data) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
      const customers = await retrieveCustomers(organizationId, environment);
      return Result.ok(customers);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
