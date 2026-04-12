import { createMeteredAISDK } from "@stellartools/aisdk-adapter";

const meteredAISDK = createMeteredAISDK({
  apiKey: process.env.STELLAR_API_KEY,
  productId: process.env.STELLAR_METERED_PRODUCT_ID,
});

export async function POST(req: Request) {
  const { messages, customerId } = await req.json();

  const response = await meteredAISDK.streamText(customerId, {
    messages,
  });

  return response;
}
