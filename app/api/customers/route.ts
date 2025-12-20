import { resolveApiKey } from "@/actions/apikey";
import { postCustomer, retrieveCustomers } from "@/actions/customers";
import { Customer } from "@/db";
import { schemaFor } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postCustomerSchema = schemaFor<
  Pick<
    Customer,
    "email" | "name" | "phone" | "appMetadata" | "internalMetadata"
  >
>()(
  z.object({
    email: z.email(),
    phone: z.string(),
    name: z.string(),
    appMetadata: z.record(z.string(), z.any()).default({}),
    internalMetadata: z.record(z.string(), z.any()).default({}),
  })
);

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey)
    return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const { error, data } = postCustomerSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const customer = await postCustomer({
    ...data,
    organizationId,
    environment,
  });

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
