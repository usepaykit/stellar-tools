import { resolveApiKey } from "@/actions/apikey";
import { postCheckout } from "@/actions/checkout";
import { postCustomer, retrieveCustomer } from "@/actions/customers";
import { triggerWebhooks } from "@/actions/webhook";
import { Checkout, Customer } from "@/db";
import { schemaFor, tryCatchAsync } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postCheckoutSchema = schemaFor<
  Partial<Checkout> & { customerEmail?: string; amount?: number }
>()(
  z.object({
    priceId: z.string().optional(),
    amount: z.number().optional(),
    assetCode: z.string().optional(),
    description: z.string().optional(),
    customerId: z.string().optional(),
    metadata: z.record(z.string(), z.any()).default({}),
    customerEmail: z.email().optional(),
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

  if (data?.customerId) {
    customer = await retrieveCustomer(data.customerId, organizationId);
  } else if (data?.customerEmail) {
    customer = await postCustomer({
      email: data.customerEmail as string,
      name: data.customerEmail?.split("@")[0],
      organizationId,
      environment,
      ...(data.metadata && { appMetadata: data.metadata }),
    });

    await tryCatchAsync(
      triggerWebhooks(organizationId, "customer.created", { customer })
    );
  } else {
    throw new Error("Customer ID or email is required");
  }

  const checkout = await postCheckout({
    ...data,
    organizationId,
    environment,
    customerId: customer?.id,
    ...(data.amount && { amount: data.amount }),
    ...(data.assetCode && { assetCode: data.assetCode }),
  });

  await tryCatchAsync(
    triggerWebhooks(organizationId, "checkout.created", { checkout })
  );

  return NextResponse.json({ data: checkout });
};
