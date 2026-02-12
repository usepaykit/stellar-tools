import { MeteredPluginConfig } from "@stellartools/plugin-sdk";
import { createUploadthing } from "uploadthing/server";

import { MeteredUploadthing } from "./provider";

export const createMeteredUploadthing = (config: MeteredPluginConfig) => {
  const adapter = new MeteredUploadthing(config);

  return adapter.routerFactory as unknown as ReturnType<typeof createUploadthing>;
};
