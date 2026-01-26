import { MeteredAISDK } from "./provider";
import { MeterConfig } from "./schema";

export const createMeteredAISDK = (config: MeterConfig) => {
  return new MeteredAISDK(config);
};
