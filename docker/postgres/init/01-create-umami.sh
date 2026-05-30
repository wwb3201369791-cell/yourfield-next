#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${UMAMI_DATABASE_PASSWORD:-}" ]]; then
  echo "UMAMI_DATABASE_PASSWORD is required for local Umami database initialization." >&2
  exit 1
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -v umami_password="$UMAMI_DATABASE_PASSWORD" <<'SQL'
CREATE USER umami WITH PASSWORD :'umami_password';
CREATE DATABASE umami OWNER umami;
GRANT ALL PRIVILEGES ON DATABASE umami TO umami;
SQL
