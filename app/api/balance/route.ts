import { retrieveOrganizationIdAndSecret } from "@/actions/organization";
import { StellarCoreApi } from "@/integrations/stellar-core";
import { apiHandler, createOptionsHandler } from "@/lib/api-handler";
import { Result } from "@stellartools/core";

export const OPTIONS = createOptionsHandler();

export const GET = apiHandler({
  auth: ["session", "apikey"],
  handler: async ({ auth: { organizationId, environment } }) => {
    const { secret } = await retrieveOrganizationIdAndSecret(organizationId, environment);

    if (!secret?.publicKey) return Result.ok([]);

    const api = new StellarCoreApi(environment);
    const result = await api.retrieveAccount(secret.publicKey);

    if (result.isErr()) return Result.ok([]);

    return Result.ok(result.value?.balances ?? []);
  },
});
