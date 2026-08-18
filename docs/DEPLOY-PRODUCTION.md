# Production deployment on GoDaddy VPS
# Domain: numa-iq.com | App path: /var/www/numaiq

## ⚠ Critical: two separate databases

SuperTokens and the app **must not share one PostgreSQL database**.  
Never run `prisma db push` against a DB that SuperTokens uses — it will drop auth tables.

| Database | Used by |
|----------|---------|
| `numaiq` | Prisma (organizations, users, etc.) |
| `supertokens` | SuperTokens core only |

`DATABASE_URL` → `.../numaiq`  
SuperTokens docker env → `.../supertokens`

---

| Component | How it runs |
|-----------|-------------|
| Website + Platform UI | Static files in `dist/` (nginx) |
| API + SuperTokens middleware | Node on port 3001 (systemd) |
| PostgreSQL + SuperTokens core | Docker (localhost only) |

---

## One-time server setup

SSH in as `generaladmin`:

```bash
ssh generaladmin@YOUR_VPS_IP
```

### 1. Install Docker (if not installed)

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker generaladmin
```

Log out and back in so Docker group applies.

### 2. Install Node.js 20 (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Pull latest code

```bash
cd /var/www/numaiq
git pull
```

---

## One-time: environment file

Create `/var/www/numaiq/.env` (never commit this):

```bash
nano /var/www/numaiq/.env
```

Paste and **change the passwords**:

```env
# Public URLs
VITE_SITE_URL=https://numa-iq.com
VITE_WEBSITE_DOMAIN=https://numa-iq.com
VITE_API_DOMAIN=

API_PORT=3001
API_DOMAIN=https://numa-iq.com
WEBSITE_DOMAIN=https://numa-iq.com

# Database (must match docker-compose POSTGRES_PASSWORD)
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD
DATABASE_URL=postgresql://numaiq:YOUR_STRONG_DB_PASSWORD@localhost:5432/numaiq

SUPERTOKENS_CONNECTION_URI=http://127.0.0.1:3567

SUPER_ADMIN_EMAIL=admin@numa-iq.com
SUPER_ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD

# Call audio storage on VPS 1
CALL_STORAGE_PATH=/var/www/numaiq/storage/calls
CALL_MAX_UPLOAD_BYTES=104857600
```

---

## One-time: start database + SuperTokens

```bash
cd /var/www/numaiq
docker compose up -d
docker compose ps   # both services should be "running"
```

---

## One-time: database tables

```bash
cd /var/www/numaiq
npm ci
npx prisma generate
npx prisma migrate deploy
```

If no migrations exist yet, on your **Mac** first run `npm run db:migrate`, commit the `prisma/migrations` folder, push, then `git pull` on the server and run `migrate deploy` again.

---

## One-time: build frontend

```bash
cd /var/www/numaiq
npm run build
ls dist/index.html   # must exist
```

---

## One-time: systemd service (API)

```bash
sudo cp /var/www/numaiq/deploy/numaiq-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable numaiq-api
sudo systemctl start numaiq-api
sudo systemctl status numaiq-api
```

Test API:

```bash
curl http://127.0.0.1:3001/health
# {"status":"ok"}
```

---

## One-time: update nginx

```bash
sudo cp /var/www/numaiq/deploy/nginx.conf.example /etc/nginx/sites-available/numaiq
sudo nginx -t
sudo systemctl reload nginx
```

If HTTPS is not set up yet:

```bash
sudo certbot --nginx -d numa-iq.com -d www.numa-iq.com
```

---

## Go live checklist

- [ ] https://numa-iq.com loads
- [ ] https://numa-iq.com/platform/login loads
- [ ] Sign in with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`
- [ ] Create a test organization

---

## Updating after code changes

On the VPS:

```bash
cd /var/www/numaiq
git pull
chmod +x deploy/deploy-production.sh
./deploy/deploy-production.sh
```

Or manually:

```bash
cd /var/www/numaiq
git pull
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
sudo systemctl restart numaiq-api
```

Ensure the call storage directory exists and is writable by the API user:

```bash
mkdir -p /var/www/numaiq/storage/calls
chown -R generaladmin:generaladmin /var/www/numaiq/storage
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API won't start | `sudo journalctl -u numaiq-api -n 50` |
| Login fails / CORS on `/auth/session/refresh` | See **Auth login errors** below |
| DB connection error | `docker compose ps`, verify `DATABASE_URL` password matches |
| 502 on /auth or /api | `sudo systemctl status numaiq-api` |
| CORS errors | `WEBSITE_DOMAIN` must match browser URL (http vs https, www vs bare) |

### Auth login errors (`Could not connect` / CORS on refresh)

1. **Check API is up**
   ```bash
   curl http://127.0.0.1:3001/health
   curl -X POST http://127.0.0.1:3001/auth/session/refresh
   ```

2. **Check nginx proxies `/auth` on the same scheme you use in the browser**
   ```bash
   curl -I http://numa-iq.com/auth/session/refresh
   curl -I https://numa-iq.com/auth/session/refresh   # must not be "connection refused"
   ```
   If HTTPS fails but HTTP works, run `sudo certbot --nginx -d numa-iq.com -d www.numa-iq.com`, then confirm the **443** server block in `/etc/nginx/sites-available/numaiq` includes the `/auth` and `/api` `location` blocks (certbot sometimes omits them).

3. **Rebuild frontend after pulling** (auth must call the same origin as the page)
   ```bash
   cd /var/www/numaiq
   git pull
   npm run build
   sudo systemctl restart numaiq-api
   sudo systemctl reload nginx
   ```

4. **Match `.env` to how users reach the site** — if still on HTTP only:
   ```env
   VITE_WEBSITE_DOMAIN=http://numa-iq.com
   API_DOMAIN=http://numa-iq.com
   WEBSITE_DOMAIN=http://numa-iq.com
   ```
   After HTTPS is live, switch all three to `https://numa-iq.com`.

### 500 on login (`SuperTokens core version is not compatible`)

`supertokens-node` v24 requires SuperTokens **core 12.0+** (CDI 5.4). Core 11.x will return 500 on sign-in.

```bash
cd /var/www/numaiq
git pull
sudo docker compose pull supertokens
sudo docker compose up -d supertokens
sleep 15
sudo systemctl restart numaiq-api
curl -X POST http://127.0.0.1:3001/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"formFields":[{"id":"email","value":"test@test.com"},{"id":"password","value":"x"}]}'
# Should return wrong-credentials JSON, not an HTML 500 error page
```
