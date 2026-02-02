import { createTsupConfig } from "../../tsup.config.base";

export default createTsupConfig({
  env: process.env as Record<string, string>,
});
