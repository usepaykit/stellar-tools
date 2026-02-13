import { sweepAndProcessPayment } from "@/actions/payment";
import { getCorsHeaders } from "@/constant";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  console.log("[/GET] checkout/[id]/status");

  const { id } = await context.params;

  const response = await sweepAndProcessPayment(id);

  return NextResponse.json({ status: response.status }, { headers: corsHeaders });
};
