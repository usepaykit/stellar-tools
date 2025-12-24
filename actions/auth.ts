"use server";

import { Account, Auth, auth, db } from "@/db";
import {
  clearAuthCookies,
  getAuthCookies,
  setAuthCookies,
} from "@/lib/cookies";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { postAccount, retrieveAccount } from "./account";

export const postAuth = async (params: Partial<Auth>): Promise<Auth> => {
  const [response] = await db
    .insert(auth)
    .values({ id: `au_${nanoid(25)}`, ...params } as Auth)
    .returning();

  if (!response) throw new Error("Failed to create auth");

  return response;
};

export const retieveAuth = async (id: string) => {
  const [response] = await db
    .select()
    .from(auth)
    .where(eq(auth.id, id))
    .limit(1);

  if (!response) throw new Error("Auth not found");

  return response;
};

export const putAuth = async (id: string, params: Partial<Auth>) => {
  const [response] = await db
    .update(auth)
    .set({ ...params, updatedAt: new Date() })
    .where(eq(auth.id, id))
    .returning();

  if (!response) throw new Error("Failed to update auth");

  return response;
};

export const deleteAuth = async (id: string) => {
  const [response] = await db.delete(auth).where(eq(auth.id, id)).returning();

  if (!response) throw new Error("Failed to delete auth");

  return response;
};

export const retrieveAuthByAccountId = async (accountId: string) => {
  const [response] = await db
    .select()
    .from(auth)
    .where(eq(auth.accountId, accountId))
    .limit(1);

  if (!response) throw new Error("Auth not found");

  return response;
};

export const signUp = async (
  params: Partial<Account> & { password: string }
) => {
  if (!params.email) throw new Error("Email is required");

  // Check if email already exists
  try {
    await retrieveAccount({ email: params.email.toLowerCase() });
    throw new Error("Email already registered");
  } catch (error) {
    if (error instanceof Error && error.message !== "Account not found") {
      throw error;
    }
  }

  // Hash password
  const passwordHash = await bcrypt.hash(params.password, 10);

  // Extract first and last name
  const nameParts = params.userName?.trim().split(/\s+/) || [];
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // Create account using postAccount
  const account: Account = await postAccount({
    email: params.email.toLowerCase(),
    userName: params.email.toLowerCase().split("@")[0],
    profile: {
      first_name: firstName,
      last_name: lastName,
    },
    sso: {
      values: [
        ...(params.sso?.values || []),
        {
          provider: "local",
          sub: passwordHash,
        },
      ],
    },
  });
  // Create auth record using postAuth
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const authRecord = await postAuth({
    accountId: account.id,
    provider: "local",
    accessToken: `local_${nanoid(32)}`,
    refreshToken: `refresh_${nanoid(32)}`,
    expiresAt,
    isRevoked: false,
  });

  await setAuthCookies(authRecord.accessToken, account.id, expiresAt);

  return { account, auth: authRecord };
};

export const signIn = async (params: { email: string; password: string }) => {
  const account = await retrieveAccount({
    email: params.email.toLowerCase(),
  });

  const authRecord = await retrieveAuthByAccountId(account.id);

  if (authRecord.provider !== "local") {
    throw new Error("Invalid authentication method");
  }

  if (authRecord.isRevoked) {
    throw new Error("Account access has been revoked");
  }

  //compare with the sso values for the matching provider
  const isValidPassword = await bcrypt.compare(
    params.password,
    account.sso?.values?.find((sso) => sso.provider === "local")?.sub as string
  );
  if (!isValidPassword) {
    throw new Error("Invalid email or password");
  }

  if (new Date() > authRecord.expiresAt) {
    throw new Error("Session expired. Please sign in again.");
  }
  await setAuthCookies(
    authRecord.accessToken,
    account.id,
    authRecord.expiresAt
  );
  return { account, auth: authRecord };
};

export const getCurrentUser = async () => {
  const { authToken, accountId } = await getAuthCookies();

  if (!authToken || !accountId) {
    return null;
  }

  try {
    const authRecord = await retrieveAuthByAccountId(accountId);

    // Verify token matches and is not revoked/expired
    if (
      authRecord.accessToken !== authToken ||
      authRecord.isRevoked ||
      new Date() > authRecord.expiresAt
    ) {
      return null;
    }

    const account = await retrieveAccount({ id: accountId });
    return { account, auth: authRecord };
  } catch {
    return null;
  }
};

export const signOut = async () => {
  await clearAuthCookies();
};
