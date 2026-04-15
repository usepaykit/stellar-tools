import { openai } from "@ai-sdk/openai";
import { createMeteredAISDK } from "@stellartools/aisdk-adapter";
import { NextRequest, NextResponse } from "next/server";

const meteredAISDK = createMeteredAISDK({
  apiKey: process.env.STELLAR_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, customerId, productId } = await req.json();

    const response = await meteredAISDK.streamText(
      { customerId, productId },
      {
        model: openai("gpt-4o"),
        messages,
      }
    );

    return NextResponse.json(response);
  } catch (error) {
    console.log("Error from Chat", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}
