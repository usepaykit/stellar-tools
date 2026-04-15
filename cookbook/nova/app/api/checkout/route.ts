import { StellarTools } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

const stellarTools = new StellarTools({
  apiKey: process.env.STELLAR_API_KEY!,
});

async function handler(req: NextRequest) {
  try {
    // const { productId,  } = await req.json();

    const response = await stellarTools.checkouts.create({
      productId: process.env.SUBSCRIPTION_PRODUCT_ID!,
      redirectUrl: "http://localhost:3000/success",
    });

    console.log(response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error occurred while processing checkout:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

export { handler as POST, handler as GET };
