import { resolveApiKey } from "@/actions/apikey";
import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { processStellarWebhook } from "@/actions/webhook";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postWebhookSchema = z.object({
  apiKey: z.string(),
  checkoutId: z.string(),
});

export const POST = async (req: NextRequest) => {
  const { apiKey, checkoutId } = postWebhookSchema.parse(await req.json());

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

  if (!secret) {
    return NextResponse.json({ error: "Stellar account not found" }, { status: 404 });
  }
  await processStellarWebhook(environment, secret.publicKey, organizationId, checkoutId);

  return NextResponse.json({ message: "Webhook received" });
};
