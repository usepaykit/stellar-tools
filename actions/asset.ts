"use server";

import { AssetCode } from "@/constant/schema.client";
import { Asset, Network, assets, db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postAsset = async (asset: Partial<Asset>) => {
  const [newAsset] = await db
    .insert(assets)
    .values({ id: `ast_${nanoid(25)}`, ...asset } as Asset)
    .returning();

  if (!newAsset) throw new Error("Failed to create asset");

  return newAsset;
};

export const retrieveAsset = async (id: string) => {
  const [asset] = await db.select().from(assets).where(eq(assets.id, id));

  if (!asset) throw new Error("Asset not found");

  return asset as Asset;
};

export const retrieveAssets = async (env: Network, filters?: { assetCodes?: AssetCode[] }) => {
  return await db
    .select()
    .from(assets)
    .where(
      and(eq(assets.environment, env), ...(filters?.assetCodes ? [inArray(assets.code, filters.assetCodes)] : []))
    );
};

export const putAsset = async (id: string, asset: Partial<Asset>) => {
  const [updatedAsset] = await db
    .update(assets)
    .set({ ...asset, updatedAt: new Date() })
    .where(eq(assets.id, id))
    .returning();

  if (!updatedAsset) throw new Error("Failed to update asset");

  return updatedAsset as Asset;
};

export const deleteAsset = async (id: string) => {
  await db.delete(assets).where(eq(assets.id, id)).returning();

  return null;
};
