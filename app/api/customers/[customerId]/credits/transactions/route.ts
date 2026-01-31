import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { creditTransactions, db } from "@/db";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const GET = async (req: NextRequest, context: { params: Promise<{ customerId: string }> }) => {
  const { customerId } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) return NextResponse.json({ error: "API key is required" }, { status: 400 });

  const { searchParams } = new URL(req.url);

  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        productId: Schema.string().optional(),
        limit: Schema.coerce.number().default(50),
        offset: Schema.coerce.number().default(0),
      }),
      {
        productId: searchParams.get("productId"),
        limit: searchParams.get("limit"),
        offset: searchParams.get("offset"),
      }
    ),
    async ({ productId, limit, offset }) => {
      const { organizationId } = await resolveApiKeyOrSessionToken(apiKey);
      const conditions = [
        eq(creditTransactions.customerId, customerId),
        eq(creditTransactions.organizationId, organizationId),
      ];

      if (productId) {
        conditions.push(eq(creditTransactions.productId, productId));
      }

      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(and(...conditions))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit)
        .offset(offset);

      return Result.ok(transactions);
    }
  );

  if (result.isErr()) return NextResponse.json({ error: result.error.message }, { status: 400 });

  return NextResponse.json({ data: result.value });
};
