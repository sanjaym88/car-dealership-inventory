#!/bin/sh
# Start-up for the Docker image and for Render: bring the schema up to date, make sure there is something to browse,
# optionally create an admin, then serve. Every step is safe to repeat on restart.
set -e

alembic upgrade head
python -m app.scripts.seed_inventory

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
  python -m app.scripts.create_admin --email "$ADMIN_EMAIL" --password "$ADMIN_PASSWORD"
fi

# Hosts like Render choose the port through $PORT; Docker Compose uses the default 8000.
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
