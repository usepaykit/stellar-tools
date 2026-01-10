import { LooseAutoComplete } from "@stellartools/core";
import { cookies } from "next/headers";

type CookieKey = LooseAutoComplete<
  "accessToken" | "refreshToken" | "selectedOrg"
>;

export class CookieManager {
  private readonly BASE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  async get(key: CookieKey) {
    const cookieStore = await cookies();
    return cookieStore.get(key as string)?.value;
  }

  async set(
    params: Array<{ key: CookieKey; value: string; maxAge?: number }>
  ): Promise<void> {
    const cookieStore = await cookies();
    for (const param of params) {
      cookieStore.set(param.key as string, param.value, {
        ...this.BASE_OPTIONS,
        maxAge: param.maxAge,
      });
    }
  }

  async delete(params: Array<{ key: CookieKey }>) {
    const cookieStore = await cookies();
    for (const param of params) {
      cookieStore.delete(param.key as string);
    }
  }
}
