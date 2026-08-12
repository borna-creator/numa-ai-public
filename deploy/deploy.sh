#!/usr/bin/env bash
# Run on the VPS after uploading/cloning the project.
# Usage: ./deploy/deploy.sh yourdomain.com
set -euo pipefail

DOMAIN="${1:?Usage: ./deploy/deploy.sh yourdomain.com}"
APP_DIR="/var/www/numaiq"

echo "==> Building NumaIQ for https://${DOMAIN}"
export VITE_SITE_URL="https://${DOMAIN}"

cd "$APP_DIR"
npm ci
npm run build

echo "==> Build complete. Output: ${APP_DIR}/dist"
echo "    Restart nginx if needed: sudo systemctl reload nginx"
