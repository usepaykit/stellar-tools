import { BaseLanguageModel } from "@langchain/core/language_models/base";

import { MeteredLangChain } from "./provider";
import { MeterConfig } from "./schema";

export const createMeteredModel = (config: MeterConfig, baseModel: BaseLanguageModel) => {
  return new MeteredLangChain(config, baseModel);
};
