# Recovery: fix SuperTokens + API after db push

If you ran `prisma db push` on a shared database, SuperTokens tables were dropped and login/API will fail.

## Fix on the VPS (run in order)

### 1. Pull the fixed docker-compose (separate `supertokens` database)

```bash
cd /var/www/numaiq
git pull
```

### 2. Reset Postgres volume (fresh start — no prod data yet)

```bash
sudo systemctl stop numaiq-api
sudo docker compose down
sudo docker volume rm numaiq_pgdata
```

### 3. Start Docker with separate databases

```bash
sudo docker compose up -d
sudo docker compose ps
# Wait until db is healthy and supertokens is running
sleep 10
```

Verify the `supertokens` database exists:

```bash
sudo docker exec -it numaiq-db-1 psql -U numaiq -d numaiq -c "\l"
# Should list both: numaiq | supertokens
```

### 4. Apply app schema ONLY to `numaiq` database

```bash
cd /var/www/numaiq
npx prisma generate
npx prisma db push
# Safe now — DATABASE_URL points to numaiq, not supertokens
```

### 5. Build frontend

```bash
npm run build
```

### 6. Restart API and check logs

```bash
sudo systemctl restart numaiq-api
sudo systemctl status numaiq-api
curl http://127.0.0.1:3001/health
```

If it still fails:

```bash
sudo journalctl -u numaiq-api -n 80 --no-pager
```

### 7. Test in browser

https://numa-iq.com/platform/login

---

## Docker permission tip

After `sudo usermod -aG docker generaladmin`, you must **log out and SSH back in** before `docker compose` works without sudo. Until then, use:

```bash
sudo docker compose up -d
```

---

## .env checklist

```env
DATABASE_URL=postgresql://numaiq:YOUR_PASSWORD@localhost:5432/numaiq
SUPERTOKENS_CONNECTION_URI=http://127.0.0.1:3567
API_DOMAIN=https://numa-iq.com
WEBSITE_DOMAIN=https://numa-iq.com
SUPER_ADMIN_EMAIL=admin@numa-iq.com
SUPER_ADMIN_PASSWORD=your-strong-password
```

`POSTGRES_PASSWORD` in `.env` must match the password in `DATABASE_URL`.

---

## Core upgrade: `time_joined` column missing (core 11 → 12)

If logs show:

```
Supreme admin seed failed ... column "time_joined" of relation "app_id_to_user_id" does not exist
```

SuperTokens core 12 is running against an old core 11 database schema. Reset **only** the `supertokens` database (keeps your app `numaiq` data):

```bash
cd /var/www/numaiq
sudo systemctl stop numaiq-api
sudo docker compose stop supertokens

# Recreate the supertokens database with a fresh schema
sudo docker exec numaiq-db-1 psql -U numaiq -d postgres -c "DROP DATABASE IF EXISTS supertokens;"
sudo docker exec numaiq-db-1 psql -U numaiq -d postgres -c "CREATE DATABASE supertokens;"

sudo docker compose up -d supertokens
sleep 15

# If a previous seed partially created a Prisma row without a matching auth user, remove it
sudo docker exec numaiq-db-1 psql -U numaiq -d numaiq -c "DELETE FROM \"User\" WHERE role = 'SUPER_ADMIN';"

sudo systemctl start numaiq-api
sudo journalctl -u numaiq-api -n 20 --no-pager | grep -i admin
# Expect: "Supreme admin created: admin@numa-iq.com"
```

Then test sign-in:

```bash
curl -X POST http://127.0.0.1:3001/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"formFields":[{"id":"email","value":"admin@numa-iq.com"},{"id":"password","value":"YOUR_PASSWORD_FROM_ENV"}]}'
```

If you have **no app data to keep**, the full volume reset in the section above is simpler.
