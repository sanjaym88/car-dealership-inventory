#!/bin/sh
# Container start-up: bring the schema up to date, make sure there is something to browse,
# optionally create an admin, then serve. Every step is safe to repeat on restart.
set -e

alembic upgrade head
python -m app.scripts.seed_inventory

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  python -m app.scripts.create_admin --email "$ADMIN_EMAIL" --password "$ADMIN_PASSWORD"
fi

exec uvicorn app.main:app --host 0.0.0.0 --port 8000
