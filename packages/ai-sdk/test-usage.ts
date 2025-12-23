/**
 * Test file demonstrating usage of @stellartools/ai-sdk
 *
 * To run this file:
 * 1. Make sure you have a model provider installed (e.g., @ai-sdk/openai)
 * 2. Set your API keys in environment variables
 * 3. Run: npx tsx test-usage.ts
 */

import { createStellarAI } from "./src/index";
import { openai } from "@ai-sdk/openai"; // Example: install with `npm install @ai-sdk/openai`
import { z } from "zod";

async function testGenerateText() {
  console.log("\n=== Testing generateText ===");

  const stellar = createStellarAI({
    apiKey: process.env.STELLAR_API_KEY || "test-api-key",
    customerId: process.env.CUSTOMER_ID || "cus_test_123",
    model: openai("gpt-4o-mini"),
  });

  const result = await stellar.generateText({
    prompt: "Explain Stellar to a 5 year old in one sentence",
    model: openai("gpt-4o-mini"),
  });

  console.log(result);
}

async function testStreamText() {
  console.log("\n=== Testing streamText ===");

  const stellar = createStellarAI({
    apiKey: process.env.STELLAR_API_KEY || "test-api-key",
    customerId: process.env.CUSTOMER_ID || "cus_test_123",
    model: openai("gpt-4o-mini"),
  });

  const result = await stellar.streamText({
    prompt: "Write a haiku about space",
    model: openai("gpt-4o-mini"),
  });

  console.log(result);
}

async function testEmbed() {
  console.log("\n=== Testing embed ===");

  const stellar = createStellarAI({
    apiKey: process.env.STELLAR_API_KEY || "test-api-key",
    customerId: process.env.CUSTOMER_ID || "cus_test_123",
    model: openai("gpt-4o-mini"),
  });

  const result = await stellar.embed({
    value: "Hello, world!",
    model: openai("gpt-4o-mini") as any,
  });

  console.log(result);
}

async function testGenerateObject() {
  console.log("\n=== Testing generateObject ===");

  const stellar = createStellarAI({
    apiKey: process.env.STELLAR_API_KEY || "test-api-key",
    customerId: process.env.CUSTOMER_ID || "cus_test_123",
    model: openai("gpt-4o-mini"),
  });

  const schema = z.object({
    name: z.string(),
    age: z.number(),
    hobbies: z.array(z.string()),
  });

  const result = await stellar.generateObject({
    schema,
    prompt: "Generate a person named John who is 25 years old and likes coding and reading",
    model: openai("gpt-4o-mini"),
  });

  console.log(result);
}

async function testStreamObject() {
  console.log("\n=== Testing streamObject ===");

  const stellar = createStellarAI({
    apiKey: process.env.STELLAR_API_KEY || "test-api-key",
    customerId: process.env.CUSTOMER_ID || "cus_test_123",
    model: openai("gpt-4o-mini"),
  });

  const schema = z.object({
    step: z.string(),
    description: z.string(),
  });

  const result = await stellar.streamObject({
    schema,
    prompt: "List 3 steps to make coffee",
    model: openai("gpt-4o-mini"),
  });

  console.log(result);
}


// Run all tests
async function runAllTests() {
  try {
    await testGenerateText();
    await testStreamText();
    await testEmbed();
    await testGenerateObject();
    await testStreamObject();

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export {
  testGenerateText,
  testStreamText,
  testEmbed,
  testGenerateObject,
  testStreamObject,
};

