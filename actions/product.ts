"use server";

import { Network, Product, assets, db, products } from "@/db";
import { FileUploadApi } from "@/integrations/file-upload";
import { generateResourceId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

import { resolveOrgContext } from "./organization";

export const postProduct = async (
  params: Omit<Product, "id" | "organizationId" | "environment">,
  formDataWithFiles?: FormData,
  orgId?: string,
  env?: Network
) => {
  const imageFiles = formDataWithFiles?.getAll("images");

  if (imageFiles) {
    const imageUploadResult = await new FileUploadApi().upload(imageFiles as File[]);

    params.images = imageUploadResult || [];
  }

  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [product] = await db
    .insert(products)
    .values({ ...params, id: generateResourceId("prod", organizationId, 25), organizationId, environment })
    .returning();

  return product;
};

export const retrieveProducts = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const productsList = await db
    .select({
      product: products,
      asset: assets,
    })
    .from(products)
    .where(and(eq(products.organizationId, organizationId), eq(products.environment, environment)))
    .innerJoin(assets, eq(products.assetId, assets.id));

  return productsList;
};

export const retrieveProductsWithAsset = async (orgId?: string, env?: Network, productId?: string) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

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
        eq(products.environment, environment),
        ...(productId ? [eq(products.id, productId)] : [])
      )
    );

  return result;
};

export const retrieveActiveProductsWithAsset = async (orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

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
        eq(products.environment, environment),
        eq(products.status, "active")
      )
    );

  return result;
};

export const retrieveProduct = async (id: string, organizationId: string) => {
  const [product] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .limit(1);

  if (!product) throw new Error("Product not found");

  return product;
};

export const putProduct = async (id: string, organizationId: string, retUpdate: Partial<Product>) => {
  const [product] = await db
    .update(products)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .returning();

  if (!product) throw new Error("Product not found");

  return product;
};

export const deleteProduct = async (id: string, organizationId: string) => {
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .returning();

  return null;
};
