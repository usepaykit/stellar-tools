import { NextRequest, NextResponse } from "next/server";

const REQUIRED_ENV_KEYS = ["NEXT_PUBLIC_DASHBOARD_HOST", "NEXT_PUBLIC_CHECKOUT_HOST"] as const;

type EnvKey = (typeof REQUIRED_ENV_KEYS)[number];

function getRequiredEnv(key: EnvKey): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(
      `[middleware] Missing required env: ${key}. Add it to .env (e.g. ${key}=app.example.com or localhost:3000).`
    );
  }
  return value;
}

function loadMiddlewareEnv(): Record<EnvKey, string> {
  const entries = REQUIRED_ENV_KEYS.map((key) => [key, getRequiredEnv(key)] as const);
  return Object.fromEntries(entries) as Record<EnvKey, string>;
}

const MIDDLEWARE_ENV = loadMiddlewareEnv();

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host");
  if (host === null || host === "") {
    return new NextResponse("Missing Host header", { status: 400 });
  }

  const { NEXT_PUBLIC_DASHBOARD_HOST: dashboardHost, NEXT_PUBLIC_CHECKOUT_HOST: checkoutHost } = MIDDLEWARE_ENV;
  const url = req.nextUrl;
  const searchParams = String(url.searchParams);
  const path = `${url.pathname}${searchParams ? `?${searchParams}` : ""}`;
  const pathSuffix = path === "/" ? "" : path;

  if (host === dashboardHost) {
    console.log("reaching dashboard host", dashboardHost);
    return NextResponse.rewrite(new URL(`/dashboard${pathSuffix}`, req.url));
  }
  if (host === checkoutHost) {
    return NextResponse.rewrite(new URL(`/checkout${pathSuffix}`, req.url));
  }

  return NextResponse.rewrite(new URL(`/landing${pathSuffix}`, req.url));
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};
