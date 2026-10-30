#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- Personne d'autre que l'admin n'utilise le schéma public
  REVOKE ALL ON SCHEMA public FROM PUBLIC;

  -- Extension créée une fois pour tous (voir la remarque sur les UUID plus bas)
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- Service users
  CREATE ROLE users_svc LOGIN PASSWORD '${USERS_DB_PASSWORD}';
  CREATE SCHEMA users AUTHORIZATION users_svc;
  ALTER ROLE users_svc SET search_path = users;

  -- Service sales
  CREATE ROLE sales_svc LOGIN PASSWORD '${SALES_DB_PASSWORD}';
  CREATE SCHEMA sales AUTHORIZATION sales_svc;
  ALTER ROLE sales_svc SET search_path = sales;

  -- Service products
  CREATE ROLE products_svc LOGIN PASSWORD '${PRODUCTS_DB_PASSWORD}';
  CREATE SCHEMA products AUTHORIZATION products_svc;
  ALTER ROLE products_svc SET search_path = products;

EOSQL