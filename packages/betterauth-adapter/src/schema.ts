import { BetterAuthPluginDBSchema } from "better-auth";

export const pluginSchema = {
  user: {
    fields: {
      stellarCustomerId: {
        type: "string",
        required: false,
        unique: true,
      },
    },
  },
} satisfies BetterAuthPluginDBSchema;
