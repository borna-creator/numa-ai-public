#!/usr/bin/env bash
# Production deploy script — run on the VPS as generaladmin (not sudo)
# Usage: ./deploy/deploy-production.sh
set -euo pipefail

cd /var/www/numaiq

echo "==> Installing dependencies"
npm ci

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Running database migrations"
npx prisma migrate deploy

echo "==> Building frontend"
npm run build

echo "==> Restarting API"
sudo systemctl restart numaiq-api

echo "==> Done. Check: https://numa-iq.com/platform/login"
