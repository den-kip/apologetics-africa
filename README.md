# Apologetics Africa — Full-Stack MVP

A production-ready, Dockerized full-stack platform for Apologetics Africa.

## Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 · TypeScript · Tailwind  |
| Backend    | NestJS · TypeScript · Swagger       |
| Database   | PostgreSQL 16                       |
| Cache      | Redis 7                             |
| Queue      | BullMQ (via Bull)                   |
| Mail       | Nodemailer → MailHog (dev)          |
| Container  | Docker Compose                      |

## Services

| Service   | Port  | Purpose                          |
|-----------|-------|----------------------------------|
| web       | 3000  | Next.js frontend                 |
| api       | 3001  | NestJS REST API                  |
| db        | 5432  | PostgreSQL                       |
| redis     | 6379  | Cache + job queue                |
| worker    | —     | BullMQ mail processor            |
| mailhog   | 8025  | Dev mail catcher (UI on :8025)   |

## Quick Start

```bash
# 1. Copy env (edit secrets before deploying)
cp .env.example .env

# 2. Start all services
make up

# 3. Seed sample data
make seed

# 4. Open
#   Frontend:  http://localhost:3000
#   API docs:  http://localhost:3001/api/docs
#   MailHog:   http://localhost:8025
```

## Pages

| Route           | Description                              |
|-----------------|------------------------------------------|
| `/`             | Home — hero, topics, resources, Q&A, blog |
| `/resources`    | Searchable + filterable resource library |
| `/questions`    | Answered Q&A + submit new question form  |
| `/questions/:slug` | Individual answered question          |
| `/blog`         | Blog listing with tag filter + search    |
| `/blog/:slug`   | Full blog post                           |
| `/admin`        | Admin dashboard (no auth gate in dev)    |

## API Endpoints

All endpoints prefixed `/api/v1/`. Full Swagger docs at `/api/docs`.

### Auth
- `POST /auth/register` — Create account
- `POST /auth/login` — Login → access + refresh tokens
- `POST /auth/refresh` — Refresh access token
- `POST /auth/logout` — Invalidate refresh token
- `GET  /auth/me` — Current user profile

### Resources (public read, admin/editor write)
- `GET    /resources` — List with filters (type, category, search, pagination)
- `GET    /resources/featured` — Featured resources
- `GET    /resources/:slug` — Single resource (increments view count)
- `POST   /resources` — Create (admin/editor)
- `PATCH  /resources/:id` — Update (admin/editor)
- `DELETE /resources/:id` — Delete (admin)

### Questions (public submit + read answered, admin manage)
- `POST  /questions` — Submit question (triggers confirmation email)
- `GET   /questions` — List answered questions
- `GET   /questions/:slug` — Single answered question
- `GET   /questions/admin/all` — All questions (admin/editor)
- `PATCH /questions/:id/answer` — Answer a question (triggers notification email)
- `PATCH /questions/:id/reject` — Reject a question (admin)
- `DELETE /questions/:id` — Delete (admin)

### Blog (public read, admin/editor write)
- `GET    /blog` — List published posts (search, tag, pagination)
- `GET    /blog/recent` — Recent posts
- `GET    /blog/tags` — All tags
- `GET    /blog/:slug` — Single post
- `POST   /blog` — Create post (admin/editor)
- `PATCH  /blog/:id` — Update post (admin/editor)
- `DELETE /blog/:id` — Delete (admin)

### Users (admin only)
- `GET    /users` — List users
- `PATCH  /users/:id` — Update user
- `DELETE /users/:id` — Delete user

## Development Commands

```bash
make up          # Start all containers
make down        # Stop all containers
make logs        # Tail all logs (or: make logs svc=api)
make seed        # Seed sample data
make shell-api   # Shell into API container
make shell-db    # psql into the database
make clean       # Destroy everything including volumes
```

## Environment Variables

See `.env.example` for all required variables. Key ones:

```
JWT_SECRET             — Sign access tokens (must be changed in prod)
JWT_REFRESH_SECRET     — Sign refresh tokens (must be changed in prod)
NEXTAUTH_SECRET        — NextAuth session secret
POSTGRES_PASSWORD      — Database password
```

## Production Checklist

- [ ] Replace all `*_SECRET` values with cryptographically random strings
- [ ] Set `NODE_ENV=production` in all services
- [ ] Configure real SMTP (replace MailHog with SendGrid / SES)
- [ ] Add a reverse proxy (Nginx / Caddy) with TLS
- [ ] Set `FRONTEND_URL` and `NEXTAUTH_URL` to your real domain
- [ ] Disable `synchronize: true` in TypeORM (already disabled in prod mode)
- [ ] Run `migration:generate` + `migration:run` instead of `synchronize`
- [ ] Add rate limiting tuning for your traffic level
- [ ] Configure Sentry / Datadog for error monitoring
