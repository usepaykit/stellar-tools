import { retrieveAssets } from "@/actions/asset";
import { Network } from "@/db";
import TOML from "@iarna/toml";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";

export const GET = async (request: NextRequest) => {
  const searchParams = new URL(request.url).searchParams;
  const environment = (searchParams.get("mode") as Network) ?? "mainnet";

  const assets = await retrieveAssets(environment);

  const toml = TOML.stringify({
    NETWORK_PASSPHRASE: environment === "testnet" ? TESTNET_PASSPHRASE : MAINNET_PASSPHRASE,
    URI_REQUEST_SIGNING_KEY: process.env.KEEPER_PUBLIC_KEY!,
    CURRENCIES: assets
      .map(
        (asset) =>
          `{ code: "${asset.code}", native: ${asset.issuer === "native" ? true : false}, issuer: "${asset.issuer}" }`
      )
      .join("\n"),
  });

  return new NextResponse(toml, {
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
