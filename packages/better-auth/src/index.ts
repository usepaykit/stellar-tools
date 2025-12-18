import type { BetterAuthPlugin } from "better-auth";
import { createPayment } from "./routes";
import { payment, user } from "./schema";
import type { StellarOptions } from "./types";

export const stellar = (options: StellarOptions) => {
  return {
    id: "stellar",
    endpoints: {
      createPayment: createPayment(options),
    },
    schema: { ...payment, ...user },
  } satisfies BetterAuthPlugin;
};
