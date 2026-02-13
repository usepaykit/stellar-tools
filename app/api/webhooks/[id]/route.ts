import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { deleteWebhook, putWebhook, retrieveWebhook } from "@/actions/webhook";
import { getCorsHeaders } from "@/constant";
import { Result, z as Schema, updateWebhookSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const GET = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params;
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const result = await Result.andThenAsync(validateSchema(Schema.string(), id), async (id) => {
    const { organizationId, environment } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);
    return await retrieveWebhook(id, organizationId, environment).then(Result.ok);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};

export const PUT = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const { id } = await context.params;

  const result = await Result.andThenAsync(validateSchema(updateWebhookSchema, await req.json()), async (data) => {
    const { organizationId, environment } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);
    return await putWebhook(id, data, organizationId, environment).then(Result.ok);
  });

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};

export const DELETE = async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const apiKey = req.headers.get("x-api-key");
  const authToken = req.headers.get("x-auth-token");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!apiKey && !authToken) {
    return NextResponse.json({ error: "API Key or Auth Token is required" }, { status: 400, headers: corsHeaders });
  }

  const result = await Result.andThenAsync(
    validateSchema(Schema.object({ id: Schema.string() }), await context.params),
    async ({ id }) => {
      const { organizationId, environment } = await resolveApiKeyOrAuthorizationToken(apiKey, authToken);
      return await deleteWebhook(id, organizationId, environment).then(Result.ok);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: { success: true } }, { headers: corsHeaders });
};
