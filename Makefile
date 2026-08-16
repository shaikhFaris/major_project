.PHONY: install dev dev-backend dev-frontend db-up db-down db-migrate db-generate test lint

# ── Database ──────────────────────────────────────────────
db-up:
	docker compose up -d
	@echo "Waiting for PostgreSQL to be ready..."
	@sleep 3
	@echo "PostgreSQL is ready on port 5432"

db-down:
	docker compose down

db-generate:
	cd backend && npx drizzle-kit generate

db-migrate:
	cd backend && npx drizzle-kit migrate

db-studio:
	cd backend && npx drizzle-kit studio

db-reset:
	docker compose down -v
	docker compose up -d
	@sleep 3

# ── Install ───────────────────────────────────────────────
install:
	cd backend && npm install
	cd frontend && npm install

# ── Dev servers ───────────────────────────────────────────
dev-backend:
	cd backend && npm run dev

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Starting backend and frontend..."
	$(MAKE) dev-backend & $(MAKE) dev-frontend & wait

# ── Test ──────────────────────────────────────────────────
test-backend:
	cd backend && npm test

test:
	$(MAKE) test-backend

# ── Lint ──────────────────────────────────────────────────
lint-backend:
	cd backend && npm run lint

lint:
	$(MAKE) lint-backend

# ── Setup (full first-time) ───────────────────────────────
setup: db-up install db-generate db-migrate
	@echo "✅ Setup complete! Run 'make dev' to start."
