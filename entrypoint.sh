#!/bin/sh

npm install --include=dev

echo "Waiting for PostgreSQL..."

# Wait until PostgreSQL is ready
until pg_isready -h "${DATABASE_HOST:-db}" -p 5432 -U "${POSTGRES_USER}"; do
  sleep 1
done

echo "PostgreSQL is ready, running Prisma..."

# Generate Prisma client
npx prisma generate

if [ "$NODE_ENV" = "production" ]; then
  echo "Running production migration..."
  npx prisma migrate deploy
else
  echo "Running development schema sync..."
  npx prisma db push
fi

echo "Starting the bot..."

# Execute command passed to this script
exec "$@"


