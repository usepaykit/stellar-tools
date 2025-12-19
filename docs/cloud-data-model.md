# Stellar Tools Cloud Core Data Model

The goal of this project is to provide a stripe-like developer experience for stellar payments, including checkout, customers, products, transactions, and usage-based billing.

---

## 1. Identity & Access Management

### Account

The top-level user entity.

```typescript
export interface Account {
  id: string;
  email: string;
  username: string;
  profile: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  phone_number?: string;
  sso?: {
    provider: string;
    provider_id: string;
  };
  created_at: Date;
  updated_at: Date;
  metadata: object;
}
```

> **Constraints:**
>
> - `email`: UNIQUE
> - `username`: UNIQUE

### Organization

The billing and ownership boundary.

```typescript
export interface Organization {
  id: string;
  name: string;
  description?: string;
  owner_account_id: string; // FK(Account.id)
  settings: {
    default_currency: "USD";
    stellar_network: "testnet" | "mainnet";
    statement_descriptor?: string;
  };
  created_at: Date;
  updated_at: Date;
  metadata: object;
}
```

### TeamMember

Join table for Users and Organizations.

```typescript
export interface TeamMember {
  id: string;
  organization_id: string; // FK(Organization.id)
  account_id: string; // FK(Account.id)
  role: "owner" | "admin" | "developer" | "viewer";
  created_at: Date;
  updated_at: Date;
  metadata: object;
}
```

> **Constraints:**
>
> - `UNIQUE(organization_id, account_id)`

### ApiKey

```typescript
export interface ApiKey {
  id: string;
  organization_id: string; // FK(Organization.id)
  name: string;
  key_hash: string;
  scope: string[]; // e.g. ["checkout:write", "usage:read"]
  is_revoked: boolean;
  created_at: Date;
  last_used_at?: Date;
  metadata: object;
}
```

> **Constraints:**
>
> - `key_hash`: UNIQUE

---

## 2. Stellar & Payments

### StellarAccount

Internal custodial accounts or tracked external wallets.

```typescript
export interface StellarAccount {
  id: string;
  organization_id: string;
  customer_id?: string;
  public_key: string;
  memo?: string;
  type: "custodial" | "external";
  network: "testnet" | "mainnet";
  created_at: Date;
  metadata: object;
}
```

> **Constraints:**
>
> - `UNIQUE(public_key, network)`

### Asset

Supported Stellar assets (Native XLM or Trustline assets).

```typescript
export interface Asset {
  id: string;
  code: string; // e.g., "XLM", "USDC"
  issuer?: string;
  network: "testnet" | "mainnet";
  metadata: object;
}
```

> **Constraints:**
>
> - `UNIQUE(code, issuer, network)`

---

## 3. Product & Billing

### Product

```typescript
export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  asset_id: string; // FK(Asset.id)
  billing_type: "one_time" | "recurring" | "metered";
  active: boolean;
  created_at: Date;
  updated_at: Date;
  metadata: object;
}
```

### Customer

```typescript
export interface Customer {
  id: string;
  organization_id: string;
  email?: string;
  name?: string;
  phone?: string;
  app_metadata: object; // Exposed to client
  internal_metadata: object; // Internal only
  created_at: Date;
  updated_at: Date;
}
```

> **Constraints:**
>
> - `UNIQUE(organization_id, email)` WHERE `email` IS NOT NULL

---

## 4. Checkout & Transactions

### Checkout

A session-based payment request.

```typescript
export interface Checkout {
  id: string;
  organization_id: string;
  api_key_id?: string;
  customer_id?: string;
  price_id: string;
  status: "open" | "completed" | "expired" | "failed";
  payment_url: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  metadata: object;
}
```

### Payment

Recorded on-chain transactions.

```typescript
export interface Payment {
  id: string;
  organization_id: string;
  checkout_id?: string;
  customer_id?: string;
  stellar_account_id: string;
  asset_id: string;
  amount: number;
  transaction_hash: string;
  status: "pending" | "confirmed" | "failed";
  created_at: Date;
}
```

> **Constraints:**
>
> - `transaction_hash`: UNIQUE

---

## 5. Usage & Automation

### UsageRecord

Used for metered/usage-based billing.

```typescript
export interface UsageRecord {
  id: string;
  organization_id: string;
  api_key_id: string;
  customer_id?: string;
  feature: string; // e.g., "ai_call"
  quantity: number;
  created_at: Date;
  metadata: object;
}
```

> **Indexing Note:** Needs index on `(organization_id, feature, created_at)` for fast aggregation.

### Webhook & Logging

```typescript
export interface Webhook {
  id: string;
  organization_id: string;
  url: string;
  secret: string;
  events: string[];
  is_disabled: boolean;
  created_at: Date;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: object;
  status_code?: number;
  error_message?: string;
  created_at: Date;
}
```
