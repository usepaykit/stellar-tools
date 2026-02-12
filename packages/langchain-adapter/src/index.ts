import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { MeteredPluginConfig } from "@stellartools/plugin-sdk";

import { MeteredLangChain } from "./provider";

export const createMeteredModel = (config: MeteredPluginConfig, baseModel: BaseLanguageModel) => {
  return new MeteredLangChain(config, baseModel);
};
