"use server";

import { Account, Auth, auth, db } from "@/db";
import {
  clearAuthCookies,
  getAuthCookies,
  setAuthCookies,
} from "@/lib/cookies";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import { nanoid } from "nanoid";

import { postAccount, putAccount, retrieveAccount } from "./account";

const getGoogleClient = () => {
  const clientId =
    process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }
  return new OAuth2Client(clientId);
};

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

// Forgot Password - Generate reset token
export const forgotPassword = async (email: string) => {
  try {
    const account = await retrieveAccount({ email: email.toLowerCase() });
    const authRecord = await retrieveAuthByAccountId(account.id);

    // Generate reset token
    const resetToken = `reset_${nanoid(32)}`;
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // 1 hour expiry

    // Store reset token in auth metadata
    const updatedMetadata = {
      ...((authRecord.metadata as object) || {}),
      resetToken,
      resetTokenExpires: resetTokenExpires.toISOString(),
    };

    await putAuth(authRecord.id, {
      metadata: updatedMetadata,
    });

    // TODO: Send email with reset link
    const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail(
      email,
      "Reset Password",
      `<a href="${resetLink}">Reset Password</a>`
    );
    return { success: true };
  } catch (error) {
    // Don't reveal if email exists or not for security
    if (error instanceof Error && error.message === "Account not found") {
      return { success: true }; // Return success even if account doesn't exist
    }
    throw error;
  }
};

// Reset Password - Verify token and update password
export const resetPassword = async (token: string, newPassword: string) => {
  // Find auth record with matching reset token
  const authRecords = await db
    .select()
    .from(auth)
    .where(eq(auth.isRevoked, false))
    .limit(100); // Reasonable limit

  let authRecord: Auth | null = null;
  for (const record of authRecords) {
    const metadata = record.metadata as {
      resetToken?: string;
      resetTokenExpires?: string;
    } | null;
    if (metadata?.resetToken === token) {
      // Check if token is expired
      if (metadata.resetTokenExpires) {
        const expiresAt = new Date(metadata.resetTokenExpires);
        if (new Date() > expiresAt) {
          throw new Error("Reset token has expired");
        }
      }
      authRecord = record;
      break;
    }
  }

  if (!authRecord) {
    throw new Error("Invalid or expired reset token");
  }

  // Get account
  const account = await retrieveAccount({ id: authRecord.accountId });

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password in account SSO
  const updatedSso = {
    values: [
      ...(account.sso?.values?.filter((sso) => sso.provider !== "local") || []),
      {
        provider: "local",
        sub: passwordHash,
      },
    ],
  };

  await putAccount(account.id, { sso: updatedSso });

  // Clear reset token from metadata
  const updatedMetadata = {
    ...((authRecord.metadata as object) || {}),
  };
  delete (
    updatedMetadata as { resetToken?: string; resetTokenExpires?: string }
  ).resetToken;
  delete (
    updatedMetadata as { resetToken?: string; resetTokenExpires?: string }
  ).resetTokenExpires;

  await putAuth(authRecord.id, {
    metadata: updatedMetadata,
  });

  return { success: true };
};

// Update Password - For authenticated users
export const updatePassword = async (
  currentPassword: string,
  newPassword: string
) => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Not authenticated");
  }

  const account = user.account;

  // Verify current password
  const currentPasswordHash = account.sso?.values?.find(
    (sso) => sso.provider === "local"
  )?.sub as string;

  if (!currentPasswordHash) {
    throw new Error("Password not set for this account");
  }

  const isValidPassword = await bcrypt.compare(
    currentPassword,
    currentPasswordHash
  );

  if (!isValidPassword) {
    throw new Error("Current password is incorrect");
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password in account SSO
  const updatedSso = {
    values: [
      ...(account.sso?.values?.filter((sso) => sso.provider !== "local") || []),
      {
        provider: "local",
        sub: newPasswordHash,
      },
    ],
  };

  await putAccount(account.id, { sso: updatedSso });

  return { success: true };
};

export const handleGoogleOAuth = async (
  idToken: string,
  intent: "SIGN_IN" | "SIGN_UP"
) => {
  try {
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience:
        process.env.GOOGLE_CLIENT_ID ||
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid token payload");
    }

    // Verify required claims
    if (!payload.email) {
      throw new Error("Email not found in token");
    }

    if (!payload.email_verified) {
      throw new Error("Email not verified");
    }

    // Verify the token is for the correct audience
    const clientId =
      process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      throw new Error("Token audience mismatch");
    }

    const email = payload.email.toLowerCase();
    const googleSub = payload.sub;

    let account: Account;
    try {
      account = await retrieveAccount({ email });

      const hasGoogleSSO = account.sso?.values?.some(
        (sso) => sso.provider === "google" && sso.sub === googleSub
      );

      if (!hasGoogleSSO) {
        const updatedSso = {
          values: [
            ...(account.sso?.values || []),
            {
              provider: "google",
              sub: googleSub,
            },
          ],
        };
        await putAccount(account.id, { sso: updatedSso });
      }

      let authRecord: Auth;
      try {
        authRecord = await retrieveAuthByAccountId(account.id);

        if (authRecord.provider !== "google") {
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          authRecord = await putAuth(authRecord.id, {
            provider: "google",
            accessToken: `google_${nanoid(32)}`,
            refreshToken: `refresh_${nanoid(32)}`,
            expiresAt,
            isRevoked: false,
          });
        }
      } catch {
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        authRecord = await postAuth({
          accountId: account.id,
          provider: "google",
          accessToken: `google_${nanoid(32)}`,
          refreshToken: `refresh_${nanoid(32)}`,
          expiresAt,
          isRevoked: false,
        });
      }

      await setAuthCookies(
        authRecord.accessToken,
        account.id,
        authRecord.expiresAt
      );

      return { account, auth: authRecord };
    } catch {
      if (intent === "SIGN_UP") {
        const nameParts = payload.name?.split(/\s+/) || [];
        const firstName = payload.given_name || nameParts[0] || "";
        const lastName =
          payload.family_name || nameParts.slice(1).join(" ") || "";

        account = await postAccount({
          email,
          userName: email.split("@")[0],
          profile: {
            first_name: firstName,
            last_name: lastName,
            avatar_url: payload.picture,
          },
          sso: {
            values: [
              {
                provider: "google",
                sub: googleSub,
              },
            ],
          },
        });

        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        const authRecord = await postAuth({
          accountId: account.id,
          provider: "google",
          accessToken: `google_${nanoid(32)}`,
          refreshToken: `refresh_${nanoid(32)}`,
          expiresAt,
          isRevoked: false,
        });

        await setAuthCookies(authRecord.accessToken, account.id, expiresAt);

        return { account, auth: authRecord };
      } else {
        throw new Error("Account not found. Please sign up first.");
      }
    }
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error("Google authentication failed");
  }
};

export const googleSignin = async (metadata: Record<string, any>) => {
  const authUrlDomain = "https://accounts.google.com/o/oauth2/v2/auth";

  const authUrlParams = {
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL}/api/auth/verify-callback`,
    response_type: "id_token",
    scope: "profile email",
    nonce: nanoid(19),
    prompt: "consent",
    state: btoa(JSON.stringify({ ...metadata })),
  };

  const authUrl = `${authUrlDomain}?${new URLSearchParams(authUrlParams as Record<string, string>)}`;
  return authUrl;
};
