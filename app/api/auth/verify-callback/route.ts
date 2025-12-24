import { handleGoogleOAuth } from "@/actions/auth";
import { OAuth2Client } from "google-auth-library";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  if (error) {
    const errorDescription =
      searchParams.get("error_description") || "Authentication failed";
    return NextResponse.redirect(
      new URL(
        `/signin?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription)}`,
        req.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/signin?error=no_code&error_description=No authorization code received",
        req.url
      )
    );
  }

  let intent: "SIGN_IN" | "SIGN_UP" = "SIGN_IN";
  let redirect = "/dashboard";

  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      intent = stateData.intent || "SIGN_IN";
      redirect = stateData.redirect || "/dashboard";
    } catch {
      // ignore invalid state
    }
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured");
    }

    const client = new OAuth2Client(
      clientId,
      clientSecret,
      `${process.env.APP_URL}/api/auth/verify-callback`
    );

    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      throw new Error("No ID token received from Google");
    }

    await handleGoogleOAuth(tokens.id_token, intent);

    return NextResponse.redirect(new URL(redirect, req.url));
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.redirect(
      new URL(
        `/signin?error=auth_failed&error_description=${encodeURIComponent(errorMessage)}`,
        req.url
      )
    );
  }
}
