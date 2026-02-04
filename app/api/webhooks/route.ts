import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postWebhook } from "@/actions/webhook";
import { generateResourceId } from "@/lib/utils";
import { createWebhookSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKeyOrSessionToken(apiKey);

  const { error, data } = createWebhookSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const webhook = await postWebhook(organizationId, environment, {
    name: data.name,
    url: data.url,
    events: data.events,
    isDisabled: false,
    description: data.description ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    secret: generateResourceId("whsec", organizationId, 32),
  });

  return NextResponse.json({ data: webhook });
};
