import "server-only";

import { resolveApiKeyOrAuthorizationToken } from "@/actions/apikey";
import { getCorsHeaders } from "@/constant";
import { Result, z as Schema, validateSchema } from "@stellartools/core";
import { NextRequest, NextResponse } from "next/server";

type HandlerConfig<TBody, TParams, TQuery> = {
  schema?: {
    body?: Schema.ZodSchema<TBody>;
    params?: Schema.ZodSchema<TParams>;
    query?: Schema.ZodSchema<TQuery>;
  };
  auth?: boolean | { allowPortal?: boolean };
  handler: (args: {
    body: TBody;
    params: TParams;
    query: TQuery;
    auth: Awaited<ReturnType<typeof resolveApiKeyOrAuthorizationToken>>;
    req: NextRequest;
    authToken?: string | null;
  }) => Promise<Result<any, Error>>;
  headers?: Record<string, string>;
};

export const apiHandler = <TBody = any, TParams = any, TQuery = any>(config: HandlerConfig<TBody, TParams, TQuery>) => {
  return async (req: NextRequest, context: { params: Promise<any> }) => {
    const origin = req.headers.get("origin");
    const corsHeaders = getCorsHeaders(origin);

    try {
      const rawParams = await context.params;

      const { searchParams } = new URL(req.url);
      const rawQuery = Object.fromEntries(searchParams.entries());

      let authResult: null | Awaited<ReturnType<typeof resolveApiKeyOrAuthorizationToken>> = null;

      if (config.auth) {
        const apiKey = req.headers.get("x-api-key");
        const authToken = req.headers.get("x-auth-token");
        const portalToken = req.headers.get("x-portal-token");

        if (!apiKey && !authToken && (!portalToken || typeof config.auth === "boolean")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
        }

        authResult = await resolveApiKeyOrAuthorizationToken(
          apiKey,
          authToken,
          typeof config.auth === "object" && config.auth.allowPortal ? portalToken : undefined
        );
      }

      let body: TBody = {} as TBody;
      if (config.schema?.body) {
        const json = await req.json().catch(() => ({}));
        const v = validateSchema(config.schema.body, json);
        if (v.isErr()) return NextResponse.json({ error: v.error.message }, { status: 400, headers: corsHeaders });
        body = v.value;
      }

      let params: TParams = rawParams;
      if (config.schema?.params) {
        const v = validateSchema(config.schema.params, rawParams);
        if (v.isErr()) return NextResponse.json({ error: v.error.message }, { status: 400, headers: corsHeaders });
        params = v.value;
      }

      let query: TQuery = rawQuery as any;

      if (config.schema?.query) {
        const v = validateSchema(config.schema.query, rawQuery);
        if (v.isErr()) return NextResponse.json({ error: v.error.message }, { status: 400, headers: corsHeaders });
        query = v.value;
      }

      let result: Result<any, Error>;

      if (authResult) {
        const authToken = req.headers.get("x-auth-token");

        result = await config.handler({ body, params, query, auth: authResult, req, authToken });

        if (result.isErr()) {
          return NextResponse.json({ error: result.error.message }, { status: 400, headers: corsHeaders });
        }

        return NextResponse.json(
          { data: result.value },
          { status: 200, headers: { ...corsHeaders, ...(config.headers ?? {}) } }
        );
      }
    } catch (error: any) {
      console.error("[API_ERROR]", error);
      return NextResponse.json(
        { error: error.message || "Internal Server Error" },
        { status: 500, headers: corsHeaders }
      );
    }
  };
};

export const createOptionsHandler = () => (req: NextRequest) =>
  new NextResponse(null, { status: 204, headers: getCorsHeaders(req.headers.get("origin")) });
