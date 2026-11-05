#!/usr/bin/env bash
# Sobe um Postgres temporário, aplica stub do Supabase + migrações + seed e roda os testes de acesso.
set -euo pipefail
PG=/usr/lib/postgresql/16/bin
DIR=$(mktemp -d); chown postgres "$DIR"
su postgres -c "$PG/initdb -D $DIR/d >/dev/null && $PG/pg_ctl -D $DIR/d -o '-k $DIR -p 5498' -l $DIR/log start >/dev/null"
trap 'su postgres -c "$PG/pg_ctl -D $DIR/d stop >/dev/null"; rm -rf $DIR' EXIT
cp supabase/tests/supabase_stub.sql supabase/migrations/*.sql supabase/seed.sql supabase/tests/rls_test.sql "$DIR"/; chmod 644 "$DIR"/*.sql
run(){ su postgres -c "psql -h $DIR -p 5498 -q -v ON_ERROR_STOP=1 -f $DIR/$1"; }
run supabase_stub.sql
for f in supabase/migrations/*.sql; do run "$(basename "$f")"; done
run seed.sql
run seed.sql   # seed é idempotente: rodar 2x não pode falhar
run rls_test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
