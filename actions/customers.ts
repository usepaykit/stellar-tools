"use server";

import { withEvent } from "@/actions/event";
import { resolveOrgContext } from "@/actions/organization";
import {
  Customer,
  CustomerMetadata,
  Network,
  ResolvedCustomer,
  creditBalances as creditBalancesSchema,
  customerPortalSessions,
  customerWallets,
  customers as customersSchema,
  db,
  payments as paymentsSchema,
  products as productsSchema,
  subscriptions as subscriptionsSchema,
} from "@/db";
import { CustomerWallet as CustomerWalletSchema } from "@/db";
import { uploadFiles } from "@/integrations/file-upload";
import { computeDiff, generateResourceId } from "@/lib/utils";
import { mergeWithNullDeletes } from "@/lib/utils";
import { MaybeArray } from "@stellartools/core";
import crypto from "crypto";
import { SQL, and, desc, eq, gt, inArray, or } from "drizzle-orm";
import moment from "moment";

export const createCustomerImage = async (formData: FormData): Promise<string | undefined> => {
  const imageFile = formData.get("image");

  if (imageFile) {
    const uploadResult = await uploadFiles([imageFile as File], { maxSizeKB: 48 });
    return uploadResult?.[0] ?? undefined;
  }

  return undefined;
};

export const postCustomers = async (
  params: Omit<Customer, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt">[],
  orgId?: string,
  env?: Network,
  options?: { source?: string }
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const logId = generateResourceId("wh_evt", organizationId, 52);

  return withEvent(
    async () => {
      const results = await db
        .insert(customersSchema)
        .values(
          params.map((p) => ({ ...p, id: generateResourceId("cus", organizationId, 20), organizationId, environment }))
        )
        .returning();

      return results;
    },
    (customers) => {
      const data = customers.map(({ id, name, email, phone, metadata }) => ({
        id,
        name,
        email,
        phone,
        metadata,
        ...(options?.source ? { source: options.source } : {}),
      }));

      return {
        events: [
          {
            type: "customer::created",
            map: () => data.map((c) => ({ customerId: c.id, data: { ...c, eventId: logId } })),
          },
        ],
        webhooks: { organizationId, environment, triggers: [{ event: "customer.created", map: () => data, logId }] },
      };
    }
  );
};

type CustomerLookup = { id?: string | null } | { email?: string | null } | { phone?: string | null };

export const retrieveCustomers = async (
  params?: MaybeArray<CustomerLookup>,
  options?: { withWallets?: boolean },
  orgId?: string,
  env?: Network
): Promise<ResolvedCustomer[]> => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const lookupArray = Array.isArray(params) ? params : params ? [params] : [];
  const ids: string[] = [];
  const emails: string[] = [];
  const phones: string[] = [];

  lookupArray.forEach((p) => {
    if ("id" in p && p.id) ids.push(p.id);
    if ("email" in p && p.email) emails.push(p.email);
    if ("phone" in p && p.phone) phones.push(p.phone);
  });

  const orFilters = [
    ids.length ? inArray(customersSchema.id, ids) : null,
    emails.length ? inArray(customersSchema.email, emails) : null,
    phones.length ? inArray(customersSchema.phone, phones) : null,
  ].filter(Boolean) as SQL[];

  const query = db
    .select({
      customer: customersSchema,
      ...(options?.withWallets && { wallet: customerWallets }),
    })
    .from(customersSchema)
    .where(
      and(
        orFilters.length ? or(...orFilters) : undefined,
        eq(customersSchema.organizationId, organizationId),
        eq(customersSchema.environment, environment)
      )
    );

  if (options?.withWallets) {
    query.leftJoin(customerWallets, eq(customersSchema.id, customerWallets.customerId));
  }

  const rows = await query;

  const customerMap = new Map<string, ResolvedCustomer>();

  for (const row of rows) {
    const { customer } = row;
    const wallet = "wallet" in row ? row.wallet : null;

    if (!customerMap.has(customer.id)) {
      customerMap.set(customer.id, {
        ...customer,
        ...(options?.withWallets && { wallets: [] }),
      });
    }

    if (wallet) {
      customerMap.get(customer.id)!.wallets!.push(wallet);
    }
  }

  return Array.from(customerMap.values());
};

export const putCustomer = async (
  id: string,
  retUpdate: Partial<Customer>,
  orgId?: string,
  env?: Network,
  options?: { source?: string }
) => {
  const [{ organizationId, environment }, [oldCustomer]] = await Promise.all([
    resolveOrgContext(orgId, env),
    retrieveCustomers({ id }, undefined, orgId, env),
  ]);

  const logId = generateResourceId("wh_evt", organizationId, 52);

  return withEvent(
    async () => {
      const [customer] = await db
        .update(customersSchema)
        .set({
          ...retUpdate,
          updatedAt: new Date(),

          ...(retUpdate.metadata !== undefined
            ? {
                metadata: mergeWithNullDeletes(oldCustomer?.metadata, retUpdate.metadata) as CustomerMetadata,
              }
            : {}),
        })
        .where(
          and(
            eq(customersSchema.id, id),
            eq(customersSchema.organizationId, organizationId),
            eq(customersSchema.environment, environment)
          )
        )
        .returning();

      if (!customer) throw new Error("Customer not found");

      return customer;
    },
    {
      events: [
        {
          type: "customer::updated",
          map: (newCustomer) => ({
            customerId: newCustomer.id,
            data: {
              $changes: computeDiff(oldCustomer ?? {}, newCustomer, undefined, ".") ?? {},
              ...(options?.source ? { source: options.source } : {}),
              eventId: logId,
            },
          }),
        },
      ],
      webhooks: {
        organizationId,
        environment,
        triggers: [
          {
            event: "customer.updated",
            map: (newCustomer) => computeDiff(oldCustomer, newCustomer) ?? {},
            logId,
          },
        ],
      },
    }
  );
};

export const upsertCustomer = async (
  lookUpKeys: MaybeArray<CustomerLookup>,
  orgId: string,
  env: Network,
  additionalParams: { name?: string; metadata?: CustomerMetadata; image?: string }
) => {
  const lookupArray = Array.isArray(lookUpKeys) ? lookUpKeys : lookUpKeys ? [lookUpKeys] : [];

  const existing = await retrieveCustomers(
    lookupArray.map((p) => ({
      id: "id" in p ? p.id : undefined,
      email: "email" in p ? p.email : undefined,
      phone: "phone" in p ? p.phone : undefined,
    })),
    undefined,
    orgId,
    env
  ).then(([c]) => c);

  if (existing) return existing;

  return await postCustomers(
    [
      {
        email: lookupArray.filter((p) => "email" in p).map((p) => ("email" in p ? p.email : undefined))[0] ?? null,
        name: additionalParams.name ?? null,
        phone: lookupArray.filter((p) => "phone" in p).map((p) => ("phone" in p ? p.phone : undefined))[0] ?? null,
        metadata: additionalParams.metadata ?? null,
        image: additionalParams.image ?? null,
      },
    ],
    orgId,
    env
  ).then(([c]) => c);
};

export const deleteCustomer = async (id: string, orgId?: string, env?: Network) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const logId = generateResourceId("wh_evt", organizationId, 52);

  return withEvent(
    async () => {
      const [customer] = await db
        .delete(customersSchema)
        .where(
          and(
            eq(customersSchema.id, id),
            eq(customersSchema.organizationId, organizationId),
            eq(customersSchema.environment, environment)
          )
        )
        .returning();

      if (!customer) throw new Error("Customer not found");

      return customer;
    },
    {
      events: [],
      webhooks: {
        organizationId,
        environment,
        triggers: [{ event: "customer.deleted", map: (customer) => ({ id: customer.id, deleted: true }), logId }],
      },
    }
  );
};

// -- PORTAL --

export async function createCustomerPortalSession(customerId: string, orgId?: string, env?: Network) {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const portalId = generateResourceId("cus_ps", organizationId, 20);
  const portalToken = crypto.randomBytes(32).toString("base64url");

  const eventId = generateResourceId("evt", organizationId, 25);

  return withEvent(
    async () => {
      const [session] = await db
        .insert(customerPortalSessions)
        .values({
          id: portalId,
          token: portalToken,
          customerId,
          organizationId,
          environment,
          expiresAt: moment().add(24, "hours").toDate(),
        })
        .returning();

      const url = `${process.env.NEXT_PUBLIC_PORTAL_URL!}/${portalToken}`;

      return { session, url };
    },
    {
      events: [
        {
          type: "customer_portal_session::created",
          map: ({ session, url }) => ({
            id: eventId,
            customerId,
            data: { id: session.id, externalUrl: url, expiresAt: session.expiresAt },
          }),
        },
      ],
      webhooks: { organizationId, environment, triggers: [] },
    }
  );
}

export async function retrieveCustomerPortalSession(token: string) {
  const [session] = await db
    .select()
    .from(customerPortalSessions)
    .where(and(eq(customerPortalSessions.token, token), gt(customerPortalSessions.expiresAt, new Date())))
    .limit(1);

  return session ?? null;
}

export async function getCustomerPortalData(token: string) {
  const session = await retrieveCustomerPortalSession(token);
  if (!session) return null;

  const { customerId, organizationId, environment } = session;

  const [customer, customerSubscriptions, customerPayments, customerCredits, customerWalletList] = await Promise.all([
    db
      .select()
      .from(customersSchema)
      .where(eq(customersSchema.id, customerId))
      .limit(1)
      .then((r) => r[0] ?? null),

    db
      .select({
        id: subscriptionsSchema.id,
        status: subscriptionsSchema.status,
        currentPeriodStart: subscriptionsSchema.currentPeriodStart,
        currentPeriodEnd: subscriptionsSchema.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionsSchema.cancelAtPeriodEnd,
        canceledAt: subscriptionsSchema.canceledAt,
        productId: subscriptionsSchema.productId,
        productName: productsSchema.name,
        productType: productsSchema.type,
        productUnit: productsSchema.unit,
        creditsGranted: productsSchema.creditsGranted,
        customerWalletId: subscriptionsSchema.customerWalletId,
        walletAddress: customerWallets.address,
      })
      .from(subscriptionsSchema)
      .leftJoin(productsSchema, eq(subscriptionsSchema.productId, productsSchema.id))
      .leftJoin(customerWallets, eq(subscriptionsSchema.customerWalletId, customerWallets.id))
      .where(
        and(
          eq(subscriptionsSchema.customerId, customerId),
          eq(subscriptionsSchema.organizationId, organizationId),
          eq(subscriptionsSchema.environment, environment)
        )
      )
      .orderBy(desc(subscriptionsSchema.createdAt)),

    db
      .select()
      .from(paymentsSchema)
      .where(
        and(
          eq(paymentsSchema.customerId, customerId),
          eq(paymentsSchema.organizationId, organizationId),
          eq(paymentsSchema.environment, environment),
          eq(paymentsSchema.status, "confirmed")
        )
      )
      .orderBy(desc(paymentsSchema.createdAt))
      .limit(20),

    db
      .select({
        balance: creditBalancesSchema.balance,
        consumed: creditBalancesSchema.consumed,
        granted: creditBalancesSchema.granted,
        productId: creditBalancesSchema.productId,
        productName: productsSchema.name,
        productUnit: productsSchema.unit,
        creditsGranted: productsSchema.creditsGranted,
      })
      .from(creditBalancesSchema)
      .leftJoin(productsSchema, eq(creditBalancesSchema.productId, productsSchema.id))
      .where(
        and(
          eq(creditBalancesSchema.customerId, customerId),
          eq(creditBalancesSchema.organizationId, organizationId),
          eq(creditBalancesSchema.environment, environment)
        )
      ),

    db
      .select()
      .from(customerWallets)
      .where(
        and(
          eq(customerWallets.customerId, customerId),
          eq(customerWallets.organizationId, organizationId),
          eq(customerWallets.environment, environment)
        )
      )
      .orderBy(desc(customerWallets.createdAt)),
  ]);

  return {
    customer,
    subscriptions: customerSubscriptions,
    payments: customerPayments,
    credits: customerCredits,
    wallets: customerWalletList,
    environment,
  };
}

// -- Customer Wallet --

export const createCustomerWallet = async (
  organizationId: string,
  environment: Network,
  params: Omit<CustomerWalletSchema, "id" | "organizationId" | "environment" | "createdAt" | "updatedAt">
) => {
  const logId = generateResourceId("wh_evt", organizationId, 52);

  return withEvent(
    async () => {
      return await db
        .insert(customerWallets)
        .values({
          ...params,
          id: generateResourceId("cwl", organizationId, 20),
          organizationId,
          environment,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning()
        .then(([w]) => w);
    },
    {
      events: [
        {
          type: "customer_wallet::linked",
          map: (wallet) => ({
            customerId: wallet.customerId,
            data: { id: wallet.id, walletAddress: wallet.address, eventId: logId },
          }),
        },
      ],
      webhooks: {
        organizationId,
        environment,
        triggers: [
          {
            event: "customer.wallet_linked",
            map: (wallet) => ({
              customerId: wallet.customerId,
              data: { id: wallet.id, walletAddress: wallet.address },
            }),
            logId,
          },
        ],
      },
    }
  );
};

export const retrieveCustomerWallets = async (
  customerId: string,
  loopUpKey?: { walletAddress?: string | null } | { id?: string | null },
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  const orFilters: (SQL | undefined)[] = [];

  if (loopUpKey && "walletAddress" in loopUpKey && loopUpKey.walletAddress) {
    orFilters.push(eq(customerWallets.address, loopUpKey.walletAddress));
  }

  if (loopUpKey && "id" in loopUpKey && loopUpKey.id) {
    orFilters.push(eq(customerWallets.id, loopUpKey.id));
  }

  return await db
    .select()
    .from(customerWallets)
    .where(
      and(
        eq(customerWallets.customerId, customerId),
        eq(customerWallets.organizationId, organizationId),
        eq(customerWallets.environment, environment),
        ...orFilters.filter((f): f is SQL => !!f)
      )
    );
};

export const upsertCustomerWallet = async (
  customerId: string,
  lookUpKey: { walletAddress?: string | null } | { id?: string | null },
  orgId?: string,
  env?: Network
) => {
  const { organizationId, environment } = await resolveOrgContext(orgId, env);

  let wallet = await retrieveCustomerWallets(customerId, lookUpKey, organizationId, environment).then(
    ([w]) => w ?? null
  );

  if (wallet) return wallet;

  if ("walletAddress" in lookUpKey && lookUpKey.walletAddress) {
    wallet = await createCustomerWallet(organizationId, environment, {
      address: lookUpKey.walletAddress!,
      customerId,
      metadata: null,
    });
  }

  return wallet;
};

export const deleteCustomerPortalWallet = async (walletId: string, token: string) => {
  const session = await retrieveCustomerPortalSession(token);

  if (!session) throw new Error("Invalid or expired session");

  const { customerId, organizationId, environment } = session;

  const activeSubscription = await db
    .select({ id: subscriptionsSchema.id })
    .from(subscriptionsSchema)
    .where(
      and(
        eq(subscriptionsSchema.customerWalletId, walletId),
        eq(subscriptionsSchema.customerId, customerId),
        inArray(subscriptionsSchema.status, ["active", "trialing"])
      )
    )
    .limit(1)
    .then(([s]) => s ?? null);

  if (activeSubscription) {
    throw new Error("This wallet is linked to an active subscription and cannot be removed.");
  }

  const [deleted] = await db
    .delete(customerWallets)
    .where(
      and(
        eq(customerWallets.id, walletId),
        eq(customerWallets.customerId, customerId),
        eq(customerWallets.organizationId, organizationId),
        eq(customerWallets.environment, environment)
      )
    )
    .returning();

  if (!deleted) throw new Error("Wallet not found");

  return deleted;
};
