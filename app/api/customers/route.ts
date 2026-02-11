import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { CORS_HEADERS } from "@/constant";
import { Result, z as Schema, createCustomerSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400, headers: CORS_HEADERS });
  }

  const result = await Result.andThenAsync(validateSchema(createCustomerSchema, await req.json()), async (data) => {
    const { organizationId, environment, entitlements } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
    const [customer] = await postCustomers(
      [{ name: data.name, email: data.email, phone: data.phone ?? null, metadata: data.metadata ?? null }],
      organizationId,
      environment,
      {
        source: "API",
        customerCount: entitlements.customers,
      }
    );
    return Result.ok(customer);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: CORS_HEADERS });
  }

  return NextResponse.json({ data: result.value }, { headers: CORS_HEADERS });
};

export const GET = async (req: NextRequest) => {
  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ apiKey: Schema.string() }), { apiKey: req.headers.get("x-api-key") }),
    async ({ apiKey }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
      const customers = await retrieveCustomers(undefined, { withWallets: true }, organizationId, environment);
      return Result.ok(customers);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
