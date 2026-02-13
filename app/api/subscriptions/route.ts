import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { retrieveCustomers } from "@/actions/customers";
import { validateLimits } from "@/actions/plan";
import { retrieveProduct } from "@/actions/product";
import { listSubscriptions, postSubscriptionsBulk } from "@/actions/subscription";
import { getCorsHeaders } from "@/constant";
import { subscriptions as subscriptionsSchema } from "@/db";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { createSubscriptionSchema } from "@stellartools/core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const result = await Result.andThenAsync(validateSchema(createSubscriptionSchema, await req.json()), async (data) => {
    const { environment, organizationId, entitlements } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);

    await validateLimits(organizationId, environment, [
      {
        domain: "subscriptions",
        table: subscriptionsSchema,
        limit: entitlements.subscriptions,
        type: "capacity",
        count: data.customerIds.length,
      },
    ]);

    const [customers, product] = await Promise.all([
      retrieveCustomers(
        data.customerIds.map((id) => ({ id })),
        { withWallets: true },
        organizationId,
        environment
      ),
      retrieveProduct(data.productId, organizationId),
    ]);

    if (product.type !== "subscription") return Result.err(new Error("Product must be a subscription type"));

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);
    const successfulCustomerIds: string[] = [];
    const failedLogs: string[] = [];

    for (const customer of customers) {
      const wallet = customer.wallets?.find((w) => w.isDefault) ?? customer.wallets?.[0];
      const customerAddress = wallet?.address;

      if (!customerAddress) {
        failedLogs.push(`Customer ${customer.id}: Missing wallet.`);
        continue;
      }

      const onChainResult = await api.createSubscription({
        customerAddress,
        productId: data.productId,
        amount: product.priceAmount,
        periodStart: Math.floor(data.period.from.getTime() / 1000),
        periodEnd: Math.floor(data.period.to.getTime() / 1000),
      });

      if (onChainResult.isOk()) {
        successfulCustomerIds.push(customer.id);
      } else {
        failedLogs.push(`Customer ${customer.id}: ${onChainResult.error.message}`);
      }
    }

    if (successfulCustomerIds.length === 0) {
      return Result.err(new Error(`All transactions failed: ${failedLogs.join(" | ")}`));
    }

    await postSubscriptionsBulk(
      {
        customerIds: successfulCustomerIds,
        productId: data.productId,
        period: data.period,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
      },
      organizationId,
      environment
    );

    return Result.ok({
      count: successfulCustomerIds.length,
      failed: failedLogs,
    });
  });

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};

export const GET = async (req: NextRequest) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const { searchParams } = new URL(req.url);

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), { customerId: searchParams.get("customerId") }),
    async (data) => {
      const { environment } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);
      const subscriptions = await listSubscriptions(data.customerId, environment);
      return Result.ok(subscriptions);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};
