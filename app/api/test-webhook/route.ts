import { StellarTools } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

const stellarToolsApi = new StellarTools({ apiKey: process.env.STELLARTOOLS_API_KEY! });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-StellarTools-Signature")!;

  const isValid = stellarToolsApi.webhooks.verifySignature(body, signature, process.env.STELLARTOOLS_WEBHOOK_SECRET!);
  if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const event = JSON.parse(body);
  console.dir({ event }, { depth: 100 });
  // Handle event.type (e.g. 'payment.confirmed')
  return NextResponse.json({ received: true });
}
