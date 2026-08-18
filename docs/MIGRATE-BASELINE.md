# Baseline an existing production database (P3005)

If the VPS was set up with `prisma db push` before migrations existed, `migrate deploy` fails with:

```
Error: P3005 — The database schema is not empty
```

The database already has `Organization`, `Department`, and `User` tables. Prisma Migrate needs a recorded history before it will apply new migrations.

## One-time fix on the VPS

Run from `/var/www/numaiq` after `git pull`:

```bash
cd /var/www/numaiq

# 1. Mark the foundation migration as already applied (do NOT run its SQL)
npx prisma migrate resolve --applied 20250817000000_init

# 2. Apply the QA Phase 1 migration (scorecards + calls)
npx prisma migrate deploy
```

If step 2 still fails, apply the QA SQL manually then mark it resolved:

```bash
sudo docker exec -i numaiq-db-1 psql -U numaiq -d numaiq \
  < prisma/migrations/20260818120000_add_qa_phase1/migration.sql

npx prisma migrate resolve --applied 20260818120000_add_qa_phase1
```

Verify:

```bash
npx prisma migrate status
sudo docker exec numaiq-db-1 psql -U numaiq -d numaiq -c "\dt"
# Should include: Organization, Department, User, Scorecard, ScorecardCriterion, Call
```

## Fresh installs (new database)

No baseline needed — just run:

```bash
npx prisma migrate deploy
```

Both migrations run in order: `init` then `add_qa_phase1`.

## Never run against the SuperTokens database

`DATABASE_URL` must point to the `numaiq` database only, not `supertokens`.
