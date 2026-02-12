import { MeteredPluginConfig } from "@stellartools/plugin-sdk";

import { MeteredAISDK } from "./provider";

export const createMeteredAISDK = (config: MeteredPluginConfig) => {
  return new MeteredAISDK(config);
};
