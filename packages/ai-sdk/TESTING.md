# Testing @stellartools/ai-sdk

This directory contains test files to help you verify the SDK is working correctly.

## Files

- **`example.ts`** - Simple example matching the usage pattern from `sdk.txt`
- **`test-usage.ts`** - Comprehensive test suite covering all SDK methods

## Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Install a model provider (e.g., OpenAI):
   ```bash
   pnpm add @ai-sdk/openai
   ```

3. Set environment variables (optional, defaults provided for testing):
   ```bash
   export STELLAR_API_KEY="your-api-key"
   export CUSTOMER_ID="cus_test_123"
   export OPENAI_API_KEY="your-openai-key"  # Required for actual API calls
   ```

## Running Tests

### Simple Example
```bash
pnpm run example
```

### Full Test Suite
```bash
pnpm run test:usage
```

Or directly with tsx:
```bash
npx tsx example.ts
npx tsx test-usage.ts
```

## What Gets Tested

The test suite covers:

1. **`generateText`** - Basic text generation
2. **`streamText`** - Streaming text generation
3. **`embed`** - Text embeddings
4. **`generateObject`** - Structured object generation with Zod schema
5. **`streamObject`** - Streaming structured object generation
6. **Class instantiation** - Direct class usage (alternative to factory function)

## Expected Behavior

- If billing check passes: Returns the AI SDK result
- If billing check fails: Returns `{ type: "checkout", checkout: { url: "..." } }`

## Notes

- The `checkBilling` function currently returns a random boolean for testing
- In production, this would call the actual Stellar Tools billing API
- The checkout URL is currently hardcoded to `https://checkout.stellartools.com`

