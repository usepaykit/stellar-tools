import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { postCheckout } from "@/actions/checkout";
import { upsertCustomer } from "@/actions/customers";
import { retrieveOwnerPlan } from "@/actions/plan";
import { getCorsHeaders } from "@/constant";
import { Result, createCheckoutSchema, createDirectCheckoutSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const type = req.nextUrl.searchParams.get("type");

  const send = (data: any, status = 200) => NextResponse.json(data, { status, headers: corsHeaders });

  try {
    if (type !== "product" && type !== "direct") {
      return send({ error: "Valid type (product|direct) is required" }, 400);
    }

    const apiKey = req.headers.get("x-api-key");
    const authToken = req.headers.get("x-auth-token");

    if (!apiKey && !authToken) {
      return send({ error: "API key or Auth Token is required" }, 400);
    }

    const body = await req.json();

    const result =
      type === "product"
        ? await Result.andThenAsync(validateSchema(createCheckoutSchema, body), (d) => processCheckout(d, "product"))
        : await Result.andThenAsync(validateSchema(createDirectCheckoutSchema, body), (d) =>
            processCheckout(d, "direct")
          );

    return result.isOk() ? send({ data: result.value }) : send({ error: result.error.message }, 400);

    async function processCheckout(data: any, checkoutType: "product" | "direct") {
      const auth = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);

      const [customer, { plan }] = await Promise.all([
        upsertCustomer(
          {
            id: data.customerId,
            email: data.customerEmail,
            phone: data.customerPhone,
            name: data.customerEmail?.split("@")[0] ?? "Guest",
            metadata: data.metadata,
          },
          auth.organizationId,
          auth.environment
        ),
        retrieveOwnerPlan({ orgId: auth.organizationId }),
      ]);

      const payload = {
        organizationId: auth.organizationId,
        environment: auth.environment,
        customerId: customer.id,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        status: "open" as const,
        expiresAt: new Date(Date.now() + 864e5),
        metadata: data.metadata ?? {},
        description: data.description ?? null,
        successUrl: data.successUrl ?? null,
        successMessage: data.successMessage ?? null,
        subscriptionData: data.subscriptionData ?? null,
        internalPlanId: plan.id,
        productId: checkoutType === "product" ? data.productId : null,
        amount: checkoutType === "direct" ? data.amount : null,
        assetCode: checkoutType === "direct" ? data.assetCode : null,
        asset: checkoutType === "direct" ? data.assetCode : null,
      } as Parameters<typeof postCheckout>[0];

      const checkout = await postCheckout(payload as any, auth.organizationId, auth.environment);
      return Result.ok(checkout);
    }
  } catch (error) {
    console.error(error);
    return send({ error: "Failed to create checkout" }, 500);
  }
};
