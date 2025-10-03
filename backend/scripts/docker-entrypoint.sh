#!/bin/bash
set -e

echo "Starting Krilin AI Backend..."

# Wait for postgres to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "PostgreSQL is ready!"

# Run Alembic migrations
echo "Running database migrations..."
alembic upgrade head
echo "Migrations completed!"

# Start the application
echo "Starting uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
