import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host");

  if (!host) return new NextResponse("Missing Host header", { status: 400 });

  const url = req.nextUrl.clone();

  let prefix = "/api";

  if (host == new URL(process.env.NGROK_URL!).host || host == new URL(process.env.NEXT_PUBLIC_API_URL!).host) {
    prefix = "/api";
  } else if (host == new URL(process.env.NEXT_PUBLIC_DASHBOARD_URL!).host) {
    prefix = "/dashboard";
  } else if (host == new URL(process.env.NEXT_PUBLIC_CHECKOUT_URL!).host) {
    prefix = "/checkout";
  }

  url.pathname = `${prefix}${url.pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. all root files inside /public (e.g. /favicon.ico)
     */
    "/((?!_next/|_static/|images/|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};
