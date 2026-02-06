import { sweepAndProcessPayment } from "@/actions/payment";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS_HEADERS });

export const GET = async (_: NextRequest, context: { params: Promise<{ id: string }> }) => {
  console.log("[/GET] checkout/[id]/status");

  const { id } = await context.params;

  const response = await sweepAndProcessPayment(id);

  return NextResponse.json({ status: response.status }, { headers: CORS_HEADERS });
};
