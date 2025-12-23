import { resolveApiKey } from "@/actions/apikey";
import { postWebhook } from "@/actions/webhook";
import { Webhook } from "@/db";
import { schemaFor } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const postWebhookSchema = schemaFor<Partial<Webhook>>()(
  z.object({
    name: z.string(),
    url: z.string(),
    events: z.array(z.string()),
    isDisabled: z.boolean().default(false),
    description: z.string().optional(),
  })
);

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  const { organizationId } = await resolveApiKey(apiKey);

  const { error, data } = postWebhookSchema.safeParse(await req.json());

  if (error) return NextResponse.json({ error }, { status: 400 });

  const webhook = await postWebhook(organizationId, data);

  return NextResponse.json({ data: webhook });
};
