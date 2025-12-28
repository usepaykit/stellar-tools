import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export const productTypeEnum = z.enum(["one_time", "subscription", "metered"]);

type ProductType = z.infer<typeof productTypeEnum>;

const productStatusEnum = z.enum(["active", "archived"]);

type ProductStatus = z.infer<typeof productStatusEnum>;

export interface Product {
  /**
   * The unique identifier for the product.
   */
  id: string;

  /**
   * The organization ID of the product.
   */
  organizationId: string;

  /**
   * The name of the product.
   */
  name: string;

  /**
   * The description of the product.
   */
  description?: string;

  /**
   * The images of the product.
   */
  images: string[];

  /**
   * Whether the product requires a phone number.
   */
  phoneNumberRequired: boolean;

  /**
   * The status of the product.
   */
  status: ProductStatus;

  /**
   * The asset ID of the product.
   */
  assetId: string;

  /**
   * The billing type of the product.
   */
  type: ProductType;

  /**
   * The created at timestamp for the product.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the product.
   */
  updatedAt: string;

  /**
   * The metadata of the product.
   */
  metadata: Record<string, unknown>;

  /**
   * The environment of the product.
   */
  environment: Environment;

  /**
   * The unit of the product.
   */
  unit?: string;

  /**
   * The unit divisor of the product.
   */
  unitDivisor?: number | null;

  /**
   * The units per credit of the product.
   */
  unitsPerCredit?: number;
}

export const productSchema = schemaFor<Product>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    images: z.array(z.string()),
    phoneNumberRequired: z.boolean(),
    status: productStatusEnum,
    assetId: z.string(),
    type: productTypeEnum,
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).default({}),
    environment: environmentSchema,
    unit: z.string().optional(),
    unitDivisor: z.number().optional(),
    unitsPerCredit: z.number().optional(),
  })
);
