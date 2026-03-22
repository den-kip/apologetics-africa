.PHONY: up down logs build seed ps clean

# ─── Environment setup ────────────────────────────────────────────────────────
env:
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example — edit before proceeding")

# ─── Docker Compose ───────────────────────────────────────────────────────────
up: env
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart $(svc)

logs:
	docker compose logs -f $(svc)

ps:
	docker compose ps

# ─── Development ─────────────────────────────────────────────────────────────
install:
	cd api && npm ci
	cd web && npm ci

build:
	cd api && npm run build
	cd web && npm run build

# ─── Database ─────────────────────────────────────────────────────────────────
migration-run:
	docker compose exec api npm run migration:run

seed:
	docker compose exec api node dist/database/seed.js

# ─── Utilities ────────────────────────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
	docker system prune -f

shell-api:
	docker compose exec api sh

shell-db:
	docker compose exec db psql -U $${POSTGRES_USER:-aa_user} -d $${POSTGRES_DB:-apologetics_africa}
