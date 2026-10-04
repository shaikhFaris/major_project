# Deployment Guide

This project can be deployed with a managed PostgreSQL database, a Node backend service, and a static frontend host.

## 1) Provision PostgreSQL

Create a PostgreSQL instance on Render, Railway, Neon, or Supabase and copy the connection string into:

- `DATABASE_URL` for the backend service

## 2) Deploy backend (`/backend`)

Use these commands in your backend host:

- Build command: `npm ci && npm run build`
- Start command: `npm run start`

Required backend environment variables:

- `DATABASE_URL` (from your managed Postgres)
- `JWT_SECRET` (strong random secret)
- `PORT` (usually provided by your host; fallback is `3001`)

Optional backend environment variables:

- `ML_SERVICE_URL` (defaults to `http://localhost:8000`)
- `FRONTEND_ORIGIN` (comma-separated origins, only needed when frontend and backend are on different origins)

## 3) Run migrations during deploy

After backend dependencies are installed and `DATABASE_URL` is set, run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

## 4) Deploy frontend (`/frontend`)

Use these commands in your frontend host:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`

## 5) Configure `/api` reverse proxy/rewrite

Frontend API calls use `/api` paths. Configure your frontend host to rewrite:

- `/api/*` → `https://<your-backend-domain>/api/*`

Without this rewrite, API calls from the browser will fail.

## 6) CORS guidance

- If frontend and backend share one origin via reverse proxy, keep `FRONTEND_ORIGIN` empty.
- If frontend and backend are deployed on different origins, set `FRONTEND_ORIGIN` to allowed origin(s), for example:
  - `https://app.example.com`
  - `https://app.example.com,https://staging-app.example.com`

## 7) Smoke test checklist

After deployment:

- Frontend loads successfully.
- Auth works (register/login/me).
- `/api/auth/*` and `/api/businesses` respond.
- Simulation flow works end-to-end (create business → market config → run simulation → dashboard).
