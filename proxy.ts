import { NextRequest, NextResponse } from "next/server";

export default async function middleware(req: NextRequest): Promise<NextResponse> {
  const host = req.headers.get("host");

  if (!host) return new NextResponse("Missing Host header", { status: 400 });

  const url = req.nextUrl.clone();

  let prefix = "/landing";

  if (host == process.env.NGROK_HOST) {
    console.log("NGROK_HOST", host);
    const response = new NextResponse(null, { status: 200 });
    response.headers.set("ngrok-skip-browser-warning", "true");
    prefix = "/api";
  }

  if (host === process.env.NEXT_PUBLIC_DASHBOARD_URL?.split("://")[1]) {
    prefix = "/dashboard";
  } else if (host === process.env.NEXT_PUBLIC_CHECKOUT_URL?.split("://")[1]) {
    prefix = "/checkout";
  } else if (host == process.env.NEXT_PUBLIC_API_URL?.split("://")[1]) {
    prefix = "/api";
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
