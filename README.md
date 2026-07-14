# Buddy Script

A social feed app (register / login, posts with images, infinite feed, likes, comments) built as an npm workspaces monorepo:

| Package    | Stack                        | Default URL           |
| ---------- | ---------------------------- | --------------------- |
| `frontend` | Next.js 16 (App Router)      | http://localhost:3000 |
| `backend`  | Express 5 + Postgres + Redis | http://localhost:4000 |

---

## Prerequisites

- **Node.js 22+** and npm
- **Docker** (Postgres 16 + Redis 7 via Compose)
- A free **[Cloudinary](https://cloudinary.com)** account (needed for image posts)

---

## 1. Install dependencies

From the repo root:

```bash
npm install
```

---

## 2. Start Postgres & Redis

```bash
cd backend
docker compose up -d
```

This starts:

- Postgres at `localhost:5432` (`buddy` / `buddy_secret` / DB `buddy_script`)
- Redis at `localhost:6379`

---

## 3. Configure environment

### Backend

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` if needed. Defaults match Compose. Set a real secret and your Cloudinary credentials:

| Variable                 | Notes                                                             |
| ------------------------ | ----------------------------------------------------------------- |
| `DATABASE_URL`           | Defaults to the Compose Postgres instance                         |
| `REDIS_URL`              | `redis://localhost:6379` locally                                  |
| `ACCESS_TOKEN_SECRET`    | Long random string (do not leave the placeholder)                 |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh cookie lifetime (days)                                    |
| `CLOUDINARY_*`           | Cloud name, API key, and API secret from the Cloudinary dashboard |
| `CORS_ORIGIN`            | Frontend origin — `http://localhost:3000` for local dev           |
| `TRUST_PROXY`            | Defaults to 0                                                     |

### Frontend

```bash
cp frontend/.env.example frontend/.env
```

| Variable          | Notes                                                            |
| ----------------- | ---------------------------------------------------------------- |
| `BACKEND_API_URL` | Backend API base — default `http://localhost:4000/api/v1`        |
| `CLOUDINARY_URL`  | `cloudinary://<api_key>:<api_secret>@<cloud_name>` (server-only) |

Use the same Cloudinary project on both apps.

---

## 4. Migrate & seed the database

```bash
npm run db:migrate -w backend
npm run db:seed -w backend
```

`db:migrate` applies Prisma migrations (and generates the client). Seed loads sample users/posts for manual QA.

---

## 5. Run in development

From the repo root (frontend + backend together):

```bash
npm run dev
```

Or separately:

```bash
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:3000
```

Open **http://localhost:3000**, register an account (or use seeded users if your seed prints them), and go to `/feed`.

Health check: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## Production-style build

```bash
npm run build
npm start
```

Ensure env files (or host env vars) are set the same way as in development. Point `CORS_ORIGIN` and `BACKEND_API_URL` at your deployed origins, and use `REDIS_URL` / `DATABASE_URL` for your hosted services (`rediss://` is supported for TLS Redis).

---

## Useful scripts

| Command                         | Description                    |
| ------------------------------- | ------------------------------ |
| `npm run dev`                   | Dev: frontend + backend        |
| `npm run build` / `npm start`   | Build and run both             |
| `npm run db:migrate -w backend` | Apply migrations               |
| `npm run db:seed -w backend`    | Seed sample data               |
| `npm test -w backend`           | Backend integration/unit tests |

---

## Troubleshooting

- **`/api/health` is 503** — Postgres or Redis is down. Check `docker compose ps` in `backend/`.
- **Images fail to upload** — Confirm `CLOUDINARY_*` on the backend and `CLOUDINARY_URL` on the frontend match the same cloud.
- **Login works but API calls 401** — Frontend and backend must share cookie-friendly local origins (`localhost:3000` ↔ `localhost:4000`); `CORS_ORIGIN` must match the frontend URL.
- **Prisma client missing** — Re-run `npm run db:migrate -w backend` (or `npx prisma generate` inside `backend/`).
