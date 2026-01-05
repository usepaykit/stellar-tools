import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
};

export default function proxy(req: NextRequest) {
  const url = req.nextUrl;
  const host = req.headers.get("host")?.split(":")[0] ?? null;

  if (host === process.env.NEXT_PUBLIC_MAIN_DOMAIN) {
    return NextResponse.rewrite(
      new URL(`/main${url.pathname === "/" ? "" : url.pathname}`, req.url)
    );
  }

  if (host === process.env.NEXT_PUBLIC_CHECKOUT_DOMAIN) {
    return NextResponse.rewrite(
      new URL(`/checkout${url.pathname === "/" ? "" : url.pathname}`, req.url)
    );
  }
  if (host === process.env.NEXT_PUBLIC_SEP_DOMAIN) {
    return NextResponse.rewrite(
      new URL(`/sep${url.pathname === "/" ? "" : url.pathname}`, req.url)
    );
  }

  throw new Error(`Unknown domain: ${host}`);
}
