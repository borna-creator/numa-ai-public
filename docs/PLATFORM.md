# NumaIQ QA Platform — Foundation

Auth, organizations, departments, and users. Built step-by-step before call scoring features.

## Architecture

| Layer | Stack |
|-------|--------|
| Frontend | React + Vite + SuperTokens (session cookies) |
| API | Express on port 3001 |
| Auth | SuperTokens (self-hosted via Docker) |
| Database | PostgreSQL + Prisma |

## Roles

| Role | Capabilities |
|------|----------------|
| **SUPER_ADMIN** | Full CRUD on all organizations, org admins, departments, and users. |
| **ORG_ADMIN** | Manages departments and users within their organization. |
| **USER** | Standard member (scoring features coming later). |

## Hierarchy

```
Organization
├── Department(s)
│   └── User(s)  [email/password, assigned to one department]
└── Org Admin    [email/password, no department]
```

Public self-registration is disabled. Admins create all accounts.

## Local development

### 1. Environment

```bash
cp .env.example .env
# Edit SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD
```

### 2. Start Postgres + SuperTokens

```bash
npm run docker:up
```

### 3. Database migration

```bash
npm run db:migrate
# Name the migration when prompted, e.g. "init"
```

### 4. Run dev servers

```bash
npm run dev:all
```

- Website + platform UI: http://localhost:5173
- Platform login: http://localhost:5173/platform/login
- API (direct): http://localhost:3001/health

### 5. Sign in

Use the credentials from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` in `.env`.

## API routes

| Method | Path | Role |
|--------|------|------|
| GET | `/api/me` | Any authenticated user |
| GET/POST | `/api/organizations` | SUPER_ADMIN |
| GET/PATCH/DELETE | `/api/organizations/:orgId` | SUPER_ADMIN |
| GET/POST/PATCH/DELETE | `/api/organizations/:orgId/departments` | ORG_ADMIN, SUPER_ADMIN |
| GET/POST/PATCH/DELETE | `/api/organizations/:orgId/users` | ORG_ADMIN, SUPER_ADMIN |

SUPER_ADMIN can manage any organization via `:orgId` in nested routes. ORG_ADMIN is scoped to their own org. SUPER_ADMIN can also create, edit, and delete org admins via the users routes.

Auth endpoints are handled by SuperTokens at `/auth/*`.

## Production notes

- Set `API_DOMAIN` and `WEBSITE_DOMAIN` to your public URL (e.g. `https://numa-iq.com`)
- Proxy `/auth` and `/api` from nginx to the Node API
- Use strong `SUPER_ADMIN_PASSWORD`
- Run `npm run db:migrate` on deploy after schema changes
