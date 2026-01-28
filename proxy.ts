import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE_PATTERN = /\.(.*)$/;
const FAVICON_PATH = "/favicon.ico";
const API_PREFIX = "/api";
const NEXT_PREFIX = "/_next";
const ROOT_PATH = "/";
const DASHBOARD_PATH = "/dashboard";
const SELECT_ORG_PATH = "/select-organization";
const DASHBOARD_SELECT_ORG_PATH = "/dashboard/select-organization";
const PAY_PREFIX = "/pay/";
const CHECKOUT_PREFIX = "/checkout/";

const SHARED_PATHS = new Set<string>([
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/join",
  "/pricing",
  "/waitlist",
]);

const SUBDOMAINS = {
  DASHBOARD: "dashboard",
  CHECKOUT: "checkout",
} as const;

const HEADERS = {
  PATHNAME: "x-pathname",
  HOST: "host",
} as const;

const LOCALHOST_VARIANTS = {
  LOCALHOST: "localhost",
  LOCALHOST_IP: "127.0.0.1",
  LOCALHOST_SUFFIX: ".localhost",
  LOCALHOST_IP_SUFFIX: ".127.0.0.1",
} as const;

type Subdomain = typeof SUBDOMAINS[keyof typeof SUBDOMAINS];
type HostInfo = { hostname: string; port: string | undefined };

const isSharedPath = (pathname: string): boolean => {
  if (SHARED_PATHS.has(pathname as string)) return true;
  
  for (const sharedPath of SHARED_PATHS) {
    if (pathname.startsWith(`${sharedPath}/`)) return true;
  }
  
  return false;
};

const parseHost = (hostHeader: string | null): HostInfo => {
  const host = (hostHeader ?? "").toLowerCase().trim();
  const [hostname, port] = host.split(":");
  return { hostname: hostname || "", port: port || undefined };
};

const rootHost = (hostname: string): string => {
  if (!hostname) return "";

  if (hostname.endsWith(LOCALHOST_VARIANTS.LOCALHOST_SUFFIX)) {
    return LOCALHOST_VARIANTS.LOCALHOST;
  }
  
  if (hostname.endsWith(LOCALHOST_VARIANTS.LOCALHOST_IP_SUFFIX)) {
    return LOCALHOST_VARIANTS.LOCALHOST_IP;
  }
  
  return hostname.replace(/^www\./, "");
};

const getSubdomain = (hostname: string): Subdomain | "" => {
  if (!hostname) return "";
  
  if (hostname === LOCALHOST_VARIANTS.LOCALHOST || hostname === LOCALHOST_VARIANTS.LOCALHOST_IP) {
    return "";
  }
  
  if (hostname.endsWith(LOCALHOST_VARIANTS.LOCALHOST_SUFFIX)) {
    return hostname.slice(0, -LOCALHOST_VARIANTS.LOCALHOST_SUFFIX.length) as Subdomain;
  }
  
  if (hostname.endsWith(LOCALHOST_VARIANTS.LOCALHOST_IP_SUFFIX)) {
    return hostname.slice(0, -LOCALHOST_VARIANTS.LOCALHOST_IP_SUFFIX.length) as Subdomain;
  }
  
  const clean = hostname.replace(/^www\./, "");
  const parts = clean.split(".").filter(Boolean);
  
  if (parts.length <= 2) return "";
  
  return parts.slice(0, -2).join(".") as Subdomain;
};

const shouldSkipProxy = (pathname: string): boolean => {
  return (
    pathname.startsWith(API_PREFIX) ||
    pathname.startsWith(NEXT_PREFIX) ||
    pathname === FAVICON_PATH ||
    PUBLIC_FILE_PATTERN.test(pathname)
  );
};

const createRedirectUrl = (req: NextRequest, pathname: string, hostname?: string, port?: string): URL => {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  
  if (hostname) {
    url.hostname = hostname;
  }
  
  if (port) {
    url.port = port;
  }
  
  return url;
};

const createRewriteUrl = (req: NextRequest, pathname: string): URL => {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return url;
};

const handleDashboardSubdomain = (req: NextRequest, pathname: string): NextResponse | null => {
  if (isSharedPath(pathname)) {
    return NextResponse.next();
  }
  
  if (pathname === DASHBOARD_SELECT_ORG_PATH) {
    return NextResponse.redirect(createRedirectUrl(req, SELECT_ORG_PATH));
  }
  if (pathname === SELECT_ORG_PATH) {
    const response = NextResponse.rewrite(createRewriteUrl(req, DASHBOARD_SELECT_ORG_PATH));
    response.headers.set(HEADERS.PATHNAME, SELECT_ORG_PATH);
    return response;
  }
  
  if (pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`)) {
    const cleaned = pathname.replace(/^\/dashboard/, "") || ROOT_PATH;
    return NextResponse.redirect(createRedirectUrl(req, cleaned));
  }
  
  const newPathname = pathname === ROOT_PATH ? DASHBOARD_PATH : `${DASHBOARD_PATH}${pathname}`;
  return NextResponse.rewrite(createRewriteUrl(req, newPathname));
};

const handleCheckoutSubdomain = (req: NextRequest, pathname: string): NextResponse | null => {
  if (pathname.startsWith(PAY_PREFIX)) {
    const id = pathname.slice(PAY_PREFIX.length);
    return NextResponse.rewrite(createRewriteUrl(req, `${CHECKOUT_PREFIX}${id}`));
  }
  
  if (pathname.startsWith(CHECKOUT_PREFIX)) {
    const id = pathname.slice(CHECKOUT_PREFIX.length);
    return NextResponse.redirect(createRedirectUrl(req, `${PAY_PREFIX}${id}`));
  }
  
  return NextResponse.next();
};

const handleMainDomain = (req: NextRequest, pathname: string, apex: string, port?: string): NextResponse | null => {

  if (pathname === DASHBOARD_PATH || pathname.startsWith(`${DASHBOARD_PATH}/`)) {
    const cleaned = pathname.replace(/^\/dashboard/, "") || ROOT_PATH;
    const hostname = apex ? `${SUBDOMAINS.DASHBOARD}.${apex}` : undefined;
    return NextResponse.redirect(createRedirectUrl(req, cleaned, hostname, port));
  }
  
  if (pathname.startsWith(CHECKOUT_PREFIX)) {
    const id = pathname.slice(CHECKOUT_PREFIX.length);
    const hostname = apex ? `${SUBDOMAINS.CHECKOUT}.${apex}` : undefined;
    return NextResponse.redirect(createRedirectUrl(req, `${PAY_PREFIX}${id}`, hostname, port));
  }
  
  if (pathname.startsWith(PAY_PREFIX)) {
    const hostname = apex ? `${SUBDOMAINS.CHECKOUT}.${apex}` : undefined;
    return NextResponse.redirect(createRedirectUrl(req, pathname, hostname, port));
  }
  
  return null;
};

export function proxy(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  
  if (shouldSkipProxy(pathname)) {
    return NextResponse.next();
  }
  
  const { hostname, port } = parseHost(req.headers.get(HEADERS.HOST));
  const subdomain = getSubdomain(hostname);
  const apex = rootHost(hostname);
  
  if (subdomain === SUBDOMAINS.DASHBOARD) {
    const response = handleDashboardSubdomain(req, pathname);
    if (response) return response;
  }
  
  if (subdomain === SUBDOMAINS.CHECKOUT) {
    const response = handleCheckoutSubdomain(req, pathname);
    if (response) return response;
  }
  
  const response = handleMainDomain(req, pathname, apex, port);
  if (response) return response;
  
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!api|_next|.*\\..*).*)",
};
