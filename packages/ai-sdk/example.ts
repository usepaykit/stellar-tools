/**
 * Simple example of using @stellartools/ai-sdk
 *
 * This demonstrates the basic usage pattern from sdk.txt
 */


import { openai } from "@ai-sdk/openai";
import { createStellarAI } from "./src";

// Initialize the SDK
const stellar = createStellarAI({
  apiKey: process.env.STELLAR_API_KEY || "test-api-key",
  customerId: "cus_456",
  model: openai("gpt-4o-mini"),
});

// Example usage
async function main() {
  const result = await stellar.generateText({
    prompt: "Explain Stellar to a 5 year old",
    model: openai("gpt-4o-mini"),
  });

  console.log(result);
}

main().catch(console.error);

