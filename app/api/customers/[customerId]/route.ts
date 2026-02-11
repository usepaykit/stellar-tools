import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { deleteCustomer, putCustomer, retrieveCustomers } from "@/actions/customers";
import { CORS_HEADERS } from "@/constant";
import { updateCustomerSchema } from "@stellartools/core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });

export const GET = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), context.params),
    async ({ customerId }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
      return await retrieveCustomers({ id: customerId }, { withWallets: true }, organizationId, environment).then(
        ([customer]) => Result.ok(customer)
      );
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: CORS_HEADERS });
  }

  return NextResponse.json({ data: result.value }, { headers: CORS_HEADERS });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const { customerId } = await context.params;

  const body = (await req.json())?.body;

  const result = await Result.andThenAsync(validateSchema(updateCustomerSchema, JSON.parse(body)), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
    const customer = await putCustomer(customerId, data, organizationId, environment);
    return Result.ok(customer);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: CORS_HEADERS });
  }

  return NextResponse.json({ data: result.value }, { headers: CORS_HEADERS });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400, headers: CORS_HEADERS });
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
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: CORS_HEADERS });
  }

  return NextResponse.json({ data: result.value }, { headers: CORS_HEADERS });
};
