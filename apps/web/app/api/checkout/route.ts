import { Result, createCheckoutSchema, createDirectCheckoutSchema, validateSchema } from "@stellartools/core";
import {
  postCheckout,
  resolveApiKeyOrAuthorizationToken,
  retrieveProducts,
  upsertCustomer,
} from "@stellartools/web/actions";
import { getCorsHeaders, subscriptionIntervals } from "@stellartools/web/constant";
import { createOptionsHandler } from "@stellartools/web/lib";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = createOptionsHandler();

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
      const { customerId, customerEmail, customerPhone, metadata } = data;
      const customer = await upsertCustomer(
        { id: customerId, email: customerEmail, phone: customerPhone },
        auth.organizationId,
        auth.environment,
        { name: customerEmail?.split("@")[0] ?? "Guest", metadata }
      );

      let subscriptionData = null;

      if ("productId" in data) {
        const [{ product }] = await retrieveProducts(auth.organizationId, auth.environment, data.productId);

        if (!product) return Result.err(new Error(`Product Not Found ${data.productId}`));

        if (product.type == "subscription" && !product.recurringPeriod) {
          return Result.err(new Error("Subscription product does not have a recurring period"));
        }

        const durationDays = subscriptionIntervals[product.recurringPeriod! as keyof typeof subscriptionIntervals];

        subscriptionData = {
          periodStart: moment().toISOString(),
          periodEnd: moment().add(durationDays, "days").toISOString(),
          cancelAtPeriodEnd: false,
        };
      }

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
        redirectUrl: data.redirectUrl ?? null,
        subscriptionData,
        productId: checkoutType === "product" ? data.productId : null,
        amount: checkoutType === "direct" ? data.amount : null,
        assetCode: checkoutType === "direct" ? data.assetCode : null,
      } as Parameters<typeof postCheckout>[0];

      const checkout = await postCheckout(payload as any, auth.organizationId, auth.environment);
      return Result.ok(checkout);
    }
  } catch (error) {
    console.error(error);
    return send({ error: "Failed to create checkout" }, 500);
  }
};
