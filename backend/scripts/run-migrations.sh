#!/bin/bash
# Migration script to run before starting the app

set -e

echo "Running database migrations..."

# Wait for postgres to be ready
until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q'; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing migrations"

# Run Alembic migrations
alembic upgrade head

echo "Migrations completed successfully!"
