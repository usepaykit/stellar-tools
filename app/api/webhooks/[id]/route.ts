import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { deleteWebhook, putWebhook, retrieveWebhook } from "@/actions/webhook";
import { Result, z as Schema, updateWebhookSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;

  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(validateSchema(Schema.string(), id), async (id) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
    return await retrieveWebhook(id, organizationId, environment).then(Result.ok);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400 });
  }

  const { id } = await context.params;

  const result = await Result.andThenAsync(validateSchema(updateWebhookSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
    return await putWebhook(id, data, organizationId, environment).then(Result.ok);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ id: Schema.string() }), await context.params),
    async ({ id }) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
      return await deleteWebhook(id, organizationId, environment).then(Result.ok);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: { success: true } });
};
