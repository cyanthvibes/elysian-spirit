# Development
dev:
	docker image inspect elysian-spirit-bot-development:latest > /dev/null 2>&1 || docker buildx bake dev
	COMPOSE_BAKE=true docker compose -f docker-compose.dev.yml up

dev-migrate:
	npx prisma migrate dev --name "$${name}"

# Production
prod-pull:
	docker pull ghcr.io/cyanthvibes/elysian-spirit-bot-production:latest

prod-migrate:
	docker compose -f docker-compose.prod.yml run --rm elysian-spirit-bot-prod npx prisma migrate deploy

prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down

# Test
test-pull:
	docker pull ghcr.io/cyanthvibes/elysian-spirit-bot-production:test

test-migrate:
	docker compose -f docker-compose.prod.yml run --rm elysian-spirit-bot-prod npx prisma migrate deploy

test-up:
	docker compose -f docker-compose.prod.yml up -d

test-down:
	docker compose -f docker-compose.prod.yml down