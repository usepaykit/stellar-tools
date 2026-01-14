import { resolveApiKey } from "@/actions/apikey";
import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { triggerWebhooks } from "@/actions/webhook";
import { createCustomerSchema, tryCatchAsync } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const { error, data } = createCustomerSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const customer = await postCustomers(
    [
      {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        walletAddresses: null,
        phone: data?.phone ?? null,
      },
    ],
    organizationId,
    environment
  );

  await tryCatchAsync(
    triggerWebhooks("customer.created", { customer }, organizationId, environment)
  );

  return NextResponse.json({ data: customer });
};

export const GET = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const customers = await retrieveCustomers(organizationId, environment);

  return NextResponse.json({ data: customers });
};
