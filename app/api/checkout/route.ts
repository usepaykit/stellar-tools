import { resolveApiKey } from "@/actions/apikey";
import { postCheckout } from "@/actions/checkout";
import { retrieveCustomer } from "@/actions/customers";
import { Checkout, Customer } from "@/db";
import { schemaFor } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postCheckoutSchema = schemaFor<Partial<Checkout>>()(
  z.object({
    priceId: z.string(),
    customerId: z.string().optional(),
  })
);

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { error, data } = postCheckoutSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId, environment } = await resolveApiKey(apiKey);

  let customer: Customer | null = null;

  if (data.customerId) {
    customer = await retrieveCustomer(data.customerId, organizationId);
  } else {
    // customer = await postCustomer({ email: data.email, organizationId, environment });
  }

  const checkout = await postCheckout({ organizationId, environment });

  return NextResponse.json({ data: checkout });
};
