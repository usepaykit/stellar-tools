import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { retrieveCustomers } from "@/actions/customers";
import { retrieveProduct } from "@/actions/product";
import { listSubscriptions, postSubscriptionsBulk } from "@/actions/subscription";
import { SorobanContractApi } from "@/integrations/soroban-contract";
import { createSubscriptionSchema } from "@stellartools/core";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(createSubscriptionSchema, await req.json()), async (data) => {
    const { environment, organizationId } = await resolveApiKeyOrSessionToken(apiKey!, sessionToken!);

    const [customers, product] = await Promise.all([
      retrieveCustomers(
        data.customerIds.map((id) => ({ id })),
        organizationId,
        environment
      ),
      retrieveProduct(data.productId, organizationId),
    ]);

    const api = new SorobanContractApi(environment, process.env.KEEPER_SECRET!);

    const successfulCustomerIds: string[] = [];
    const failedLogs: string[] = [];

    if (product.type !== "subscription") {
      return Result.err(new Error("Product is not a subscription"));
    }

    for (const customer of customers) {
      const customerAddress = customer.walletAddresses?.[0]?.address;

      if (!customerAddress) {
        failedLogs.push(`Customer ${customer.id}: No wallet address found.`);
        continue;
      }

      const onChainResult = await api.createSubscription({
        customerAddress,
        productId: data.productId,
        amount: product.priceAmount,
        periodStart: Math.floor(data.period.from.getTime() / 1000),
        periodEnd: Math.floor(data.period.to.getTime() / 1000),
      });

      if (onChainResult.isOk()) successfulCustomerIds.push(customer.id);
      else failedLogs.push(`Customer ${customer.id}: ${onChainResult.error.message}`);
    }

    if (successfulCustomerIds.length === 0) {
      return Result.err(new Error(`Failed to create any subscriptions. Errors: ${failedLogs.join(", ")}`));
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

    return Result.ok({ count: successfulCustomerIds.length });
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};

export const GET = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const { searchParams } = new URL(req.url);

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ customerId: Schema.string() }), { customerId: searchParams.get("customerId") }),
    async (data) => {
      const { environment } = await resolveApiKeyOrSessionToken(apiKey);
      const subscriptions = await listSubscriptions(data.customerId, environment);
      return Result.ok(subscriptions);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result.value });
};
