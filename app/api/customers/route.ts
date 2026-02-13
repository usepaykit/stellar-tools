import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { getCorsHeaders } from "@/constant";
import { Result, z as Schema, createCustomerSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400, headers: corsHeaders });
  }

  const body = await req.json();
  const customers = Array.isArray(body) ? body : [body];

  const result = await Result.andThenAsync(
    validateSchema(Schema.array(createCustomerSchema), customers),
    async (data) => {
      const { organizationId, environment, entitlements } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
      const source = data[0].source ?? "API";

      const [customer] = await postCustomers(
        data.map((customer) => ({
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? null,
          metadata: customer.metadata ?? null,
          wallets: customer.wallets ?? [],
        })),
        organizationId,
        environment,
        { source, customerCount: entitlements.customers }
      );
      return Result.ok(customer);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
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
