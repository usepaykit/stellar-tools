import { Result } from "@stellartools/core";
import { retrieveOrganizationIdAndSecret } from "@stellartools/web/actions";
import { retrieveAccount } from "@stellartools/web/integrations";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session"],
  handler: async ({ auth: { organizationId, environment } }) => {
    const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

    if (!secret?.publicKey) return Result.ok([]);

    const accountResult = await retrieveAccount(secret.publicKey, environment);

    if (accountResult.isErr()) return Result.ok([]);

    return Result.ok(accountResult.value!.balances ?? []);
  },
});
