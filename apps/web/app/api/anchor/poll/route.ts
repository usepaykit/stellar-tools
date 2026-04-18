import { Result, z as Schema } from "@stellartools/core";
import { apiHandler, createOptionsHandler } from "@stellartools/web/lib";

export const OPTIONS = createOptionsHandler();

export const POST = apiHandler({
  auth: ["session", "apikey"],
  schema: {
    body: Schema.object({
      transferServer: Schema.string(),
      id: Schema.string(),
      anchorJwt: Schema.string(),
    }),
  },
  handler: async ({ body }) => {
    const resp = await fetch(`${body.transferServer}/transaction?id=${body.id}`, {
      headers: { Authorization: `Bearer ${body.anchorJwt}` },
    });

    if (!resp.ok) throw new Error("Failed to fetch anchor transaction status");

    const data = await resp.json();

    if (!data.transaction) throw new Error("Invalid response from anchor");

    return Result.ok(data.transaction);
  },
});
