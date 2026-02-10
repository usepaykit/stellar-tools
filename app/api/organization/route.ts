import { resolveApiKeyOrSessionToken } from "@/actions/apikey";
import { postOrganizationAndSecret } from "@/actions/organization";
import { Result, z as Schema, environmentSchema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const apiKey = req.headers.get("x-api-key");
  const sessionToken = req.headers.get("x-session-token");

  if (!apiKey && !sessionToken) {
    return NextResponse.json({ error: "API key or session token is required" }, { status: 400 });
  }

  const result = await Result.andThenAsync(
    validateSchema(
      Schema.object({
        name: Schema.string(),
        phoneNumber: Schema.string(),
        description: Schema.string().optional(),
        environment: environmentSchema,
      }),
      await req.json()
    ),
    async (data) => {
      const { entitlements } = await resolveApiKeyOrSessionToken(apiKey, sessionToken);
      const formData = await req.formData();

      /**
       * Creates a testnet account for the organization
       * Mainnet account is created later when the organization is activated
       */
      return await postOrganizationAndSecret(
        {
          name: data.name,
          phoneNumber: data.phoneNumber,
          description: data.description ?? null,
          logoUrl: null, // will be set after upload
          settings: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: null,
          address: null,
          socialLinks: null,
        },
        formData,
        data.environment,
        { organizationCount: entitlements.organizations }
      ).then(Result.ok);
    }
  );

  if (result.isErr()) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ data: result.value });
};
