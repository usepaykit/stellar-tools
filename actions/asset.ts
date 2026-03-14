"use server";

import { AssetCode } from "@/constant/schema.client";
import { Asset, Network, assets, db } from "@/db";
import { SQL, and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

export const postAsset = async (asset: Partial<Asset>) => {
  const [newAsset] = await db
    .insert(assets)
    .values({ id: `ast_${nanoid(25)}`, ...asset } as Asset)
    .returning();

  if (!newAsset) throw new Error("Failed to create asset");

  return newAsset;
};

export const retrieveAsset = async (
  lookUpKey: { id?: string } | { code?: string } | { issuer?: string } | { code?: string; issuer?: string },
  environment: Network
) => {
  let whereClause: SQL;
  if ("id" in lookUpKey) {
    whereClause = eq(assets.id, lookUpKey.id!);
  } else if ("code" in lookUpKey && "issuer" in lookUpKey) {
    whereClause = and(eq(assets.code, lookUpKey.code!), eq(assets.issuer, lookUpKey.issuer!)) as SQL;
  } else if ("code" in lookUpKey) {
    whereClause = eq(assets.code, lookUpKey.code!);
  } else if ("issuer" in lookUpKey) {
    whereClause = eq(assets.issuer, lookUpKey.issuer!);
  } else {
    throw new Error("Invalid lookup key. Must provide either id or code and issuer.");
  }

  const [asset] = await db
    .select()
    .from(assets)
    .where(and(whereClause, eq(assets.environment, environment)));

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
