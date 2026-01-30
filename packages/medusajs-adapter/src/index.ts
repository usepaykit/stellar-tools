import { ModuleProvider, Modules } from "@medusajs/framework/utils";

import { StellarToolsMedusaAdapter } from "./provider";
import { type StellarToolsMedusaAdapterOptions } from "./schema";

export default ModuleProvider(Modules.PAYMENT, {
  services: [StellarToolsMedusaAdapter],
});

export { type StellarToolsMedusaAdapterOptions, StellarToolsMedusaAdapter };
