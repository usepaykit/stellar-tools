import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host");
  if (!host) return new NextResponse("Missing Host header", { status: 400 });

  const url = req.nextUrl.clone();

  let prefix = "/landing";

  switch (host) {
    case process.env.NGROK_HOST:
    case process.env.NEXT_PUBLIC_API_HOST:
      prefix = "/api";
      break;
    case process.env.NEXT_PUBLIC_DASHBOARD_HOST:
      prefix = "/dashboard";
      break;
    case process.env.NEXT_PUBLIC_CHECKOUT_HOST:
      prefix = "/checkout";
      break;
    // default: keep prefix as "/landing"
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
