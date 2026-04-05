"use server";

import { retrieveAssets } from "@/actions/asset";
import { resolveOrgContext, setupMerchantTrustline } from "@/actions/organization";
import { Network, Product, assets, db, products } from "@/db";
import { FileUploadApi } from "@/integrations/file-upload";
import { generateResourceId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";

export const createProductImage = async (formData: FormData) => {
  const imageFiles = formData.getAll("images");

  if (imageFiles) {
    const imageUploadResult = await new FileUploadApi().upload(imageFiles as File[]);
    return imageUploadResult || [];
  }

  return [];
};

export const postProduct = async (
  params: Omit<Product, "id" | "organizationId" | "environment">,
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const [product] = await db
    .insert(products)
    .values({ ...params, id: generateResourceId("prod", organizationId, 16), organizationId, environment })
    .returning();

  console.log({ params });

  if (params.assetId) {
    const [asset] = await retrieveAssets({ id: params.assetId }, environment);
    if (!asset || !asset?.issuer || asset?.code === "XLM") return;
    setupMerchantTrustline(organizationId, environment, asset.code, asset.issuer).catch(() => {
      console.error("Failed to setup merchant trustline for asset", asset.code, asset.issuer);
    });
  }

  return product;
};

export const retrieveProducts = async (orgId?: string, env?: Network, productId?: string) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const productsList = await db
    .select({
      product: products,
      asset: assets,
    })
    .from(products)
    .where(
      and(
        eq(products.organizationId, organizationId),
        eq(products.environment, environment),
        ...(productId ? [eq(products.id, productId)] : [])
      )
    )
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
        eq(products.status, "active"),
        ...(productId ? [eq(products.id, productId)] : [])
      )
    );

  return result;
};

export const putProduct = async (id: string, organizationId: string, retUpdate: Partial<Product>) => {
  const [product] = await db
    .update(products)
    .set({ ...retUpdate, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .returning();

  if (!product) return;

  if (retUpdate.assetId) {
    const [asset] = await retrieveAssets({ id: retUpdate.assetId }, product.environment);
    if (!asset || !asset?.issuer || asset.code === "XLM") return;
    setupMerchantTrustline(organizationId, product.environment, asset.code, asset.issuer).catch((err) => {
      console.error("Failed to setup merchant trustline for asset", asset.code, asset.issuer, err);
    });
  }

  return product;
};

export const deleteProduct = async (id: string, organizationId: string) => {
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.organizationId, organizationId)))
    .returning();

  return null;
};
