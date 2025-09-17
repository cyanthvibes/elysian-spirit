# Development
dev:
	docker image inspect elysian-spirit-bot-development:latest > /dev/null 2>&1 || docker buildx bake dev
	COMPOSE_BAKE=true docker compose -f docker-compose.dev.yml up

dev-up:
	COMPOSE_BAKE=true docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

# Production
prod:
	docker buildx bake prod
	COMPOSE_BAKE=true docker compose -f docker-compose.prod.yml up

prod-up:
	docker compose -f docker-compose.prod.yml up -d

prod-down:
	docker compose -f docker-compose.prod.yml down