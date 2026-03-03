# Development

This guide covers everything you need to run Stellar Tools locally.

## Prerequisites

- [Node.js](https://nodejs.org) v20+
- [pnpm](https://pnpm.io) v9+
- [Docker](https://docker.com) (for PostgreSQL and Stellar node)

## Setup

**1. Clone the repo**

```bash
git clone https://github.com/usepaykit/stellar-tools.git
cd stellar-tools
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Fill in the values in `.env`. The required ones to get started locally:

| Variable                    | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| `DATABASE_URL`              | PostgreSQL connection string                           |
| `JWT_SECRET`                | Secret for signing JWTs                                |
| `MASTER_ENCRYPTION_KEY`     | Master key for encryption                              |
| `ENCRYPTION_SALT`           | Salt for encryption                                    |
| `RESEND_API_KEY`            | Resend API key for emails                              |
| `NEXT_PUBLIC_APP_URL`       | URL of the landing page (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_DASHBOARD_URL` | URL of the dashboard                                   |
| `NEXT_PUBLIC_API_URL`       | URL of the API                                         |

Stellar-specific variables (`RPC_URL_TESTNET`, `KEEPER_SECRET`, etc.) are only needed if you're working on blockchain features.

**4. Start Docker services**

```bash
docker compose up -d
```

This starts PostgreSQL (port 5436) and a local Stellar node with Soroban RPC.

**5. Run database migrations**

```bash
pnpm db:migrate
```

**6. Build the core package**

```bash
pnpm -C packages/stellartools build:dev
```

**7. Start the dev server**

```bash
pnpm dev
```

This runs three things concurrently:

| Service            | URL                   |
| ------------------ | --------------------- |
| Web app (Next.js)  | http://localhost:3000 |
| Docs (Mintlify)    | http://localhost:3333 |
| Inngest dev server | http://localhost:8000 |
