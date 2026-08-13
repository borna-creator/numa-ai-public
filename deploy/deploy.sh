#!/usr/bin/env bash
# Run on the VPS after uploading/cloning the project.
# Usage: ./deploy/deploy.sh yourdomain.com
set -euo pipefail

DOMAIN="${1:?Usage: ./deploy/deploy.sh yourdomain.com}"
APP_DIR="/var/www/numaiq"

echo "==> Building NumaIQ for https://${DOMAIN}"
export VITE_SITE_URL="https://${DOMAIN}"

cd "$APP_DIR"

if [ -f package-lock.json ]; then
  npm ci
else
  echo "==> No package-lock.json found, running npm install instead"
  npm install
fi

npm run build

echo "==> Build complete. Output: ${APP_DIR}/dist"
echo "    Restart nginx if needed: sudo systemctl reload nginx"
