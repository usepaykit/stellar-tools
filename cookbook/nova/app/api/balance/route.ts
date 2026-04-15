import { StellarTools } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

const client = new StellarTools({ apiKey: process.env.STELLARTOOLS_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { customerid, productId } = await req.json();
    const balance = await client.credits.check(customerid, productId);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
