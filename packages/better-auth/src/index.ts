import type { BetterAuthPlugin } from "better-auth";
import { createPayment } from "./routes";
import { payment, user } from "./schema";
import type { StellarOptions } from "./types";

export const stellar = (options: StellarOptions) => {
  return {
    id: "stellar",
    endpoints: {
      createPayment: createPayment(options),
      //   verifyPayment: verifyPayment(options),
    },
    schema: { ...payment, ...user },
    // Optional: init() for database hooks if needed
  } satisfies BetterAuthPlugin;
};
