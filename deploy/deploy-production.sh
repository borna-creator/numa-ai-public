#!/usr/bin/env bash
# Production deploy script — run on the VPS as generaladmin (not sudo)
# Usage: ./deploy/deploy-production.sh
set -euo pipefail

cd /var/www/numaiq

echo "==> Installing dependencies"
npm ci

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Syncing database schema"
npx prisma db push

echo "==> Building frontend"
npm run build

echo "==> Updating systemd service"
sudo cp deploy/numaiq-api.service /etc/systemd/system/
sudo systemctl daemon-reload

echo "==> Restarting API"
sudo systemctl restart numaiq-api
sleep 2
curl -sf http://127.0.0.1:3001/health && echo "" || (echo "API health check failed — run: sudo journalctl -u numaiq-api -n 30" && exit 1)

echo "==> Done. Check: https://numa-iq.com/platform/login"
