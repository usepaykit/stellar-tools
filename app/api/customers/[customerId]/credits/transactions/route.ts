import { resolveApiKey } from "@/actions/apikey";
import { creditTransactions, db } from "@/db";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const querySchema = z.object({
  productId: z.string().optional(),
  limit: z.coerce.number().default(50),
  offset: z.coerce.number().default(0),
});

export const GET = async (
  req: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) => {
  const { customerId } = await context.params;

  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const { error, data } = querySchema.safeParse({
    productId: searchParams.get("productId"),
    limit: searchParams.get("limit"),
    offset: searchParams.get("offset"),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  try {
    const conditions = [
      eq(creditTransactions.customerId, customerId),
      eq(creditTransactions.organizationId, organizationId),
    ];

    if (data.productId) {
      conditions.push(eq(creditTransactions.productId, data.productId));
    }

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(and(...conditions))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(data.limit)
      .offset(data.offset);

    return NextResponse.json({ data: transactions });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Failed to retrieve transactions" },
      { status: 500 }
    );
  }
};
