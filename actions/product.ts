"use server";

import { Network, Product, assets, db, products } from "@/db";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postProduct = async (params: Partial<Product>) => {
  const [product] = await db
    .insert(products)
    .values({ id: `prod_${nanoid(25)}`, ...params } as Product)
    .returning();

  return product;
};

export const retrieveProducts = async (
  organizationId: string,
  environment: Network
) => {
  const productsList = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.organizationId, organizationId),
        eq(products.environment, environment)
      )
    );

  return productsList;
};

export const retrieveProductsWithAsset = async (
  organizationId: string,
  environment: Network
) => {
  const result = await db
    .select({
      product: products,
      asset: assets,
    })
    .from(products)
    .innerJoin(assets, eq(products.assetId, assets.id))
    .where(
      and(
        eq(products.organizationId, organizationId),
        eq(products.environment, environment)
      )
    );

  return result;
};

export const retrieveProduct = async (id: string, organizationId: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(
      and(eq(products.id, id), eq(products.organizationId, organizationId))
    )
    .limit(1);

  if (!product) throw new Error("Product not found");

  return product;
};

export const putProduct = async (
  id: string,
  organizationId: string,
  retUpdate: Partial<Product>
) => {
  const [product] = await db
    .update(products)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(
      and(eq(products.id, id), eq(products.organizationId, organizationId))
    )
    .returning();

  if (!product) throw new Error("Product not found");

  return product;
};

export const deleteProduct = async (id: string, organizationId: string) => {
  await db
    .delete(products)
    .where(
      and(eq(products.id, id), eq(products.organizationId, organizationId))
    )
    .returning();

  return null;
};
