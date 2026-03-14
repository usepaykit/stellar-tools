ALTER TABLE "payment" ADD COLUMN "asset_id" text REFERENCES "asset"("id");
--> statement-breakpoint

-- Backfill from product-based checkouts: payment → checkout → product → asset
UPDATE "payment" p
SET asset_id = pr.asset_id
FROM "checkout" c
JOIN "product" pr ON c.product_id = pr.id
WHERE p.checkout_id = c.id
  AND p.asset_id IS NULL
  AND pr.asset_id IS NOT NULL;
--> statement-breakpoint

-- Backfill from direct checkouts: checkout.asset_code stores the asset ID
UPDATE "payment" p
SET asset_id = c.asset_code
FROM "checkout" c
WHERE p.checkout_id = c.id
  AND p.asset_id IS NULL
  AND c.asset_code IS NOT NULL;
