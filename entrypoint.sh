#!/bin/sh

#if [ "$NODE_ENV" = "development" ]; then
#  npm install --include=dev
#fi

echo "Waiting for PostgreSQL..."

# Wait until PostgreSQL is ready
until pg_isready -h "${DATABASE_HOST:-db}" -p 5432 -U "${POSTGRES_USER}"; do
  sleep 1
done

echo "PostgreSQL is ready, running Prisma..."

if [ "$NODE_ENV" = "development" ]; then
  echo "Running development schema sync"
  npx prisma db push
fi

echo "Starting the bot..."

# Execute command passed to this script
exec "$@"


