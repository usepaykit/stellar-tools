import { StellarToolsAISDK } from "./provider";
import { StellarToolsAISDKOptions } from "./schema";

export const createStellarToolsAISDK = (config: StellarToolsAISDKOptions) => {
  return new StellarToolsAISDK(config);
};
