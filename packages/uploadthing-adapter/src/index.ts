import { createUploadthing } from "uploadthing/server";

import { MeteredUploadthing } from "./provider";
import { MeterConfig } from "./schema";

export const createMeteredUploadthing = (config: MeterConfig) => {
  const adapter = new MeteredUploadthing(config);

  return adapter.routerFactory as unknown as ReturnType<typeof createUploadthing>;
};
