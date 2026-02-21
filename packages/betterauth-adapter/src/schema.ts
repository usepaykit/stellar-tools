import { BetterAuthPluginDBSchema } from "better-auth";

export const pluginSchema = {
  user: {
    fields: {
      stellarToolsCustomerId: {
        type: "string",
        required: false,
        unique: true,
      },
    },
  },
} satisfies BetterAuthPluginDBSchema;
