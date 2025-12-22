import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export interface Customer {
  /**
   * The unique identifier for the customer.
   */
  id: string;

  /**
   * The organization ID of the customer.
   */
  organizationId: string;
  /**
   * The email address of the customer.
   */
  email: string;

  /**
   * The name of the customer.
   */
  name: string;

  /**
   * The phone number of the customer.
   */
  phone?: string;

  /**
   * The application metadata for the customer.
   */
  appMetadata: Record<string, unknown>;

  /**
   * The created at timestamp for the customer.
   */
  createdAt: string;

  /**
   * The updated at timestamp for the customer.
   */
  updatedAt: string;

  /**
   * The environment of the customer.
   */
  environment: Environment;
}

export const customerSchema = schemaFor<Customer>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    email: z.email(),
    name: z.string(),
    phone: z.string().optional(),
    appMetadata: z.record(z.string(), z.any()).default({}),
    createdAt: z.string(),
    updatedAt: z.string(),
    environment: environmentSchema,
  })
);

export const createCustomerSchema = customerSchema.pick({
  organizationId: true,
  email: true,
  name: true,
  phone: true,
  appMetadata: true,
});

export interface CreateCustomer extends Pick<
  Customer,
  "email" | "name" | "phone" | "appMetadata"
> {
  organizationId: string;
}

export const updateCustomerSchema = customerSchema.partial().pick({
  email: true,
  name: true,
  phone: true,
  appMetadata: true,
});

export interface UpdateCustomer extends Partial<
  Pick<Customer, "email" | "name" | "phone" | "appMetadata">
> {}
