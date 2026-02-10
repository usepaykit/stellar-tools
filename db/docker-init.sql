CREATE DATABASE postgres;

DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'root') THEN
      CREATE ROLE root WITH LOGIN PASSWORD 'local';
   END IF;
END
$$;


\c postgres;
GRANT ALL ON SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO root;

INSERT INTO public.asset (code, issuer, environment) VALUES
  ('XLM', 'native', 'testnet'),
  ('XLM', 'native', 'mainnet'),
  ('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', 'testnet'),
  ('USDC', 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN', 'mainnet');

INSERT INTO public.plan
(id, name, description, amount_usd_cents, billing_events, customers, subscriptions, usage_records, payments, organizations, products)
VALUES
  (
    'pl_wKIn5iBwnpvKCPbxrzTY',
    'Free',
    'For hobby projects and testing.',
    0,
    1000, 200, 50, 0, 1000, 1, 5
  ),

  (
    'pl_YfjSEEcHVKuF1091XNxIAg',
    'Starter',
    'For indie hackers and small teams.',
    2900,
    10000, 5000, 1000, 50000, 10000, 3, 100
  ),

  (
    'pl_nxpAeER1SMSgyzbc7aoqPg',
    'Growth',
    'For growing startups with real users.',
    9900,
    100000, 50000, 10000, 500000, 100000, 5, 1000
  ),

  (
    'pl_YQXMJUc2WEpbQT7c/JT8tA',
    'Scale',
    'For high-volume production systems.',
    29900,
    1000000, 500000, 100000, 5000000, 1000000, 10, 10000
  ),

