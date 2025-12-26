import { resolveApiKey } from "@/actions/apikey";
import { retrieveOrganization } from "@/actions/organization";
import { processStellarWebhook } from "@/actions/webhook";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const postWebhookSchema = z.object({
  apiKey: z.string(),
});

export const POST = async (req: NextRequest) => {
  const { apiKey } = postWebhookSchema.parse(await req.json());

  const { organizationId, environment } = await resolveApiKey(apiKey);

  const organization = await retrieveOrganization({ id: organizationId });

  const stellarAccount = organization?.stellarAccounts?.[environment];

  if (!stellarAccount) {
    return NextResponse.json(
      { error: "Stellar account not found" },
      { status: 404 }
    );
  }
  await processStellarWebhook(environment, stellarAccount, organization);

  return NextResponse.json({ message: "Webhook received" });
};
