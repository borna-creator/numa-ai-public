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

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API won't start | `sudo journalctl -u numaiq-api -n 50` |
| Login fails | Check `API_DOMAIN` and `WEBSITE_DOMAIN` are both `https://numa-iq.com` |
| DB connection error | `docker compose ps`, verify `DATABASE_URL` password matches |
| 502 on /auth or /api | `sudo systemctl status numaiq-api` |
| CORS errors | `WEBSITE_DOMAIN` must match browser URL exactly |
