import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postCheckout } from "@/actions/checkout";
import { postCustomers, retrieveCustomers } from "@/actions/customers";
import { createCheckoutSchema } from "@stellartools/core";
import { Result, validateSchema } from "@stellartools/core";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const result = await Result.andThenAsync(validateSchema(createCheckoutSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);
    let [customer] = await retrieveCustomers(
      {
        ...((data.customerId && { id: data.customerId }) as { id: string }),
        ...((data.customerEmail && { email: data.customerEmail }) as { email: string }),
      },
      organizationId,
      environment
    );

    if (!customer && data.customerEmail) {
      [customer] = await postCustomers(
        [
          {
            email: data.customerEmail as string,
            name: data.customerEmail?.split("@")[0],
            phone: null,
            walletAddresses: null,
            metadata: data?.metadata ?? null,
          },
        ],
        organizationId,
        environment,
        { source: "Checkout API" }
      );
    }

    const checkout = await postCheckout({
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
      customerEmail: customer?.email ?? null,
      customerPhone: customer?.phone ?? null,
    });

    return Result.ok(checkout);
  });

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result.value });
};
