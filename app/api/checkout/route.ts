import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postCheckout } from "@/actions/checkout";
import { upsertCustomer } from "@/actions/customers";
import { retrieveOwnerPlan } from "@/actions/plan";
import {
  Result,
  z as Schema,
  createCheckoutSchema,
  createDirectCheckoutSchema,
  validateSchema,
} from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken)
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400 });

  const result = await Result.andThenAsync(
    validateSchema(Schema.union([createCheckoutSchema, createDirectCheckoutSchema]), await req.json()),
    async (data) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);

      const customer = await upsertCustomer(
        {
          id: data.customerId,
          email: data.customerEmail,
          phone: data.customerPhone,
          name: data.customerEmail?.split("@")[0] ?? "Guest",
          metadata: data.metadata,
        },
        organizationId,
        environment
      );

      const planResult = await retrieveOwnerPlan({ orgId: organizationId });

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

      const checkoutPayload = {
        customerId: customer.id,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        status: "open" as const,
        expiresAt,
        description: data.description ?? null,
        metadata: data.metadata ?? {},
        successUrl: data.successUrl ?? null,
        successMessage: data.successMessage ?? null,
        subscriptionData: data.subscriptionData ?? null,
        internalPlanId: planResult.plan.id,
        ...("productId" in data ? { productId: data.productId } : {}),
        ...("amount" in data ? { amount: data.amount, assetCode: data.assetCode } : {}),
        ...("assetCode" in data ? { asset: data.assetCode } : {}),
      } as Parameters<typeof postCheckout>[0];

      const checkout = await postCheckout(checkoutPayload, organizationId, environment);
      return Result.ok(checkout);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
