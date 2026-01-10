import { resolveApiKey } from "@/actions/apikey";
import { postWebhook } from "@/actions/webhook";
import { Webhook } from "@/db";
import { WebhookEvent, schemaFor, webhookEvent } from "@stellartools/core";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postWebhookSchema = schemaFor<Partial<Webhook>>()(
  z.object({
    name: z.string(),
    url: z.string(),
    events: z
      .array(
        z.custom<WebhookEvent>((v) => webhookEvent.includes(v as WebhookEvent))
      )
      .min(1, "At least one event is required"),
    isDisabled: z.boolean().default(false),
    description: z.string().optional(),
  })
);

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const { error, data } = postWebhookSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const webhook = await postWebhook(organizationId, environment, {
    name: data.name,
    url: data.url,
    events: data.events,
    isDisabled: data.isDisabled,
    description: data.description ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    secret: `whsec_${nanoid(32)}`,
  });

  return NextResponse.json({ data: webhook });
};
