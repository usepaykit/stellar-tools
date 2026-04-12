import { StellarTools } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

const client = new StellarTools({ apiKey: process.env.STELLARTOOLS_API_KEY! });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("X-StellarTools-Signature")!;

  const event = client.webhooks.constructEvent(body, signature, process.env.STELLARTOOLS_WEBHOOK_SECRET!);

  if (event.type == "customer.created") {
    const customer = event.data.object;
    console.dir(customer, { depth: 100 });
  } 
  return NextResponse.json({ received: true });
}