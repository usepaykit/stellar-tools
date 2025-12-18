import type { BetterAuthPlugin } from "better-auth";
import {
  verifyPayment,
  createSubscription,
  createPayment,
  retrieveSubscription,
  cancelSubscription,
  updateCustomer,
  retrieveCustomer,
  createCustomer,
} from "./routes";
import { getSchema } from "./schema";
import type { StellarOptions } from "./types";

export const stellarTools = (options: StellarOptions) => {
  return {
    id: "stellar",
    endpoints: {
      createCustomer: createCustomer(options),
      retrieveCustomer: retrieveCustomer(options),
      updateCustomer: updateCustomer(options),
      createPayment: createPayment(options),
      verifyPayment: verifyPayment(options),
      createSubscription: createSubscription(options),
      cancelSubscription: cancelSubscription(options),
      retrieveSubscription: retrieveSubscription(options),
    },
    schema: getSchema(options),
    init() {
      return {
        options: {
          // We can add database hooks here, e.g. to create a stellar payment record when a user is created
        },
      };
    },
  } satisfies BetterAuthPlugin;
};
