import { z } from "zod";

import { schemaFor } from "../utils";
import { Environment, environmentSchema } from "./shared";

export interface CustomerWallet {
  /**
   * The unique identifier for the wallet.
   */
  id: string;

  /**
   * The address of the wallet.
   */
  address: string;

  /**
   * The name of the wallet.
   */
  name?: string;

  /**
   * Whether the wallet is the default wallet for the customer.
   */
  isDefault: boolean;

  /**
   * The metadata of the wallet.
   */
  metadata?: Record<string, unknown>;

  /**
   * The created at timestamp for the wallet.
   */
  createdAt: string;
}

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
   * The wallets of the customer.
   */
  wallets: CustomerWallet[];

  /**
   * The phone number of the customer.
   */
  phone?: string;

  /**
   * The application metadata for the customer.
   */
  metadata?: Record<string, string> | null;

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

export const customerWalletSchema = schemaFor<CustomerWallet>()(
  z.object({
    id: z.string(),
    address: z.string(),
    name: z.string().optional(),
    isDefault: z.boolean(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string(),
    lastUsedAt: z.string().optional(),
  })
);

export const customerSchema = schemaFor<Customer>()(
  z.object({
    id: z.string(),
    organizationId: z.string(),
    email: z.email(),
    name: z.string(),
    phone: z.string().optional(),
    metadata: z.record(z.string(), z.string()).nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    environment: environmentSchema,
    wallets: z.array(customerWalletSchema),
  })
);

export const createCustomerSchema = customerSchema
  .pick({
    email: true,
    name: true,
    phone: true,
    metadata: true,
    wallets: true,
  })
  .extend({
    source: z.string().optional(),
  });

export interface CreateCustomer extends Pick<Customer, "email" | "name" | "phone" | "metadata" | "wallets"> {
  source?: string;
}

export const updateCustomerSchema = customerSchema.partial().pick({
  email: true,
  name: true,
  phone: true,
  metadata: true,
});

export interface UpdateCustomer extends Partial<Pick<Customer, "email" | "name" | "phone" | "metadata">> {}

export interface ListCustomers extends Partial<Pick<Customer, "email" | "phone">> {}

export const listCustomersSchema = schemaFor<ListCustomers>()(
  z.union([z.object({ email: z.email() }), z.object({ phone: z.string() })])
);
