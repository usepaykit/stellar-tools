import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postWebhook } from "@/actions/webhook";
import { getCorsHeaders } from "@/constant";
import { generateResourceId } from "@/lib/utils";
import { Result, z as Schema, createWebhookSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const OPTIONS = (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or Session Token is required" }, { status: 400, headers: corsHeaders });
  }

  const result = await Result.andThenAsync(
    validateSchema(createWebhookSchema.extend({ secret: Schema.string().optional() }), await req.json()),
    async (data) => {
      const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
      const webhookPayload = {
        name: data.name,
        url: data.url,
        events: data.events,
        isDisabled: false,
        description: data.description ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        secret: sessionToken && data.secret ? data.secret : generateResourceId("whsec", organizationId, 32),
      };

      return await postWebhook(organizationId, environment, webhookPayload).then(Result.ok);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
  }

  return NextResponse.json({ data: result.value }, { headers: corsHeaders });
};
