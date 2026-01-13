import { resolveApiKey } from "@/actions/apikey";
import { postCheckout } from "@/actions/checkout";
import { postCustomer, retrieveCustomer } from "@/actions/customers";
import { triggerWebhooks } from "@/actions/webhook";
import { Customer } from "@/db";
import { createCheckoutSchema, tryCatchAsync } from "@stellartools/core";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { error, data } = createCheckoutSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const { organizationId, environment } = await resolveApiKey(apiKey);

  let customer: Customer | null = null;

  if (data?.customerId) {
    customer = await retrieveCustomer({ id: data.customerId }, organizationId, environment);
  } else if (data?.customerEmail) {
    customer = await postCustomer(
      {
        email: data.customerEmail as string,
        name: data.customerEmail?.split("@")[0],
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: null,
        walletAddresses: null,
        appMetadata: data?.metadata ?? null,
      },
      organizationId,
      environment
    );

    await tryCatchAsync(
      triggerWebhooks("customer.created", { customer }, organizationId, environment)
    );
  } else {
    throw new Error("Customer ID or email is required");
  }

  const checkout = await postCheckout(
    {
      customerId: customer?.id ?? null,
      status: "open",
      expiresAt: moment().add(1, "day").toDate(),
      metadata: data?.metadata ?? {},
      amount: data.amount ?? null,
      description: data.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
      productId: data.productId ?? null,
      successMessage: data.successMessage ?? null,
      successUrl: data.successUrl ?? null,
    },
    organizationId,
    environment
  );

  await tryCatchAsync(
    triggerWebhooks("checkout.created", { checkout }, organizationId, environment)
  );

  return NextResponse.json({ data: checkout });
};
