#!/usr/bin/env bash
# Applies the migrations to a fresh Postgres database and runs the RLS tests.
# Usage: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
cd "$(dirname "$0")/.."
: "${DATABASE_URL:?set DATABASE_URL to an empty Postgres database}"
DB="lingo_test_$$"
ADMIN_URL="$DATABASE_URL"
psql "$ADMIN_URL" -q -c "create database $DB" >/dev/null
trap 'psql "$ADMIN_URL" -q -c "drop database if exists $DB" >/dev/null' EXIT
TEST_URL="${DATABASE_URL%/*}/$DB"
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/00_supabase_stub.sql
for f in supabase/migrations/*.sql; do psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/10_rls_test.sql >/dev/null
