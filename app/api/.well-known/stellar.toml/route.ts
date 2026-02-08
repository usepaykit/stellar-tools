import TOML from "@iarna/toml";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const GET = () => {
  console.log("/[GET] .well-known/stellar.toml");
  const toml = TOML.stringify({
    NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
    URI_REQUEST_SIGNING_KEY: process.env.KEEPER_PUBLIC_KEY!,
    CURRENCIES: [{ code: "XLM", native: true }],
  });

  return new NextResponse(toml, {
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
