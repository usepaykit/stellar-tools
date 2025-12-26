import { createUploadthing } from "uploadthing/server";

import { StellarToolsUploadThingAdapter } from "./provider";
import { StellarToolsUploadthingOptions } from "./schema";

export const createStellarUploadthing = (
  opts: StellarToolsUploadthingOptions
) => {
  const adapter = new StellarToolsUploadThingAdapter(opts);

  return adapter.routerFactory as unknown as ReturnType<
    typeof createUploadthing
  >;
};
