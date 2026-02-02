import { Result, StellarTools } from "@stellartools/core";
import { APIError, GenericEndpointContext } from "better-auth";

import { BillingConfig } from "./types";

export const unwrap = <T>(result: Result<T, Error>): T => {
  if (result.isErr()) {
    throw new APIError("INTERNAL_SERVER_ERROR", { message: result.error?.message ?? "Operation failed" });
  }

  return result.value!;
};

export const getContext = (ctx: GenericEndpointContext, options: BillingConfig) => {
  const session = ctx.context.session;
  if (!session?.user) throw new APIError("UNAUTHORIZED");

  return {
    user: session.user as typeof session.user & { stellarCustomerId: string },
    stellar: new StellarTools({ apiKey: options.apiKey }),
    adapter: ctx.context.adapter,
  };
};
