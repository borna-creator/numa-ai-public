# NumaIQ Website

Marketing website for **NumaIQ** — AI voice agents and QA compliance platform.

## Tech Stack

- React 19 + React Router
- Vite 8
- Tailwind CSS 4

## Getting Started

```bash
npm install
cp .env.example .env   # set your production URL
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SITE_URL` | Public site URL without trailing slash (e.g. `https://numaiq.com`). Used for Open Graph, canonical URLs, sitemap, and structured data at build time. |

## Build & Preview

```bash
npm run build
npm run preview
```

The production build outputs to `dist/` and includes:

- Optimized JS/CSS bundles
- `og_image.png` for social sharing previews
- `favicon.ico`
- `robots.txt` and `sitemap.xml` (generated with your `VITE_SITE_URL`)
- `site.webmanifest`
- SPA fallback configs (`_redirects` for Netlify, `vercel.json` for Vercel)

## Deploy

### Netlify

1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variable `VITE_SITE_URL` to your domain

### Vercel

1. Import the project
2. Vercel auto-detects Vite; `vercel.json` handles SPA routing
3. Set `VITE_SITE_URL` in project environment variables

### GoDaddy VPS (Linux)

Full step-by-step guide for a GoDaddy domain + Linux VPS. See also `deploy/nginx.conf.example` and `deploy/deploy.sh`.

#### Overview

1. Point your GoDaddy domain to the VPS IP
2. Install nginx on the VPS
3. Upload the project and build it with your domain set
4. Configure nginx to serve the `dist/` folder
5. Enable HTTPS with Let's Encrypt (free)

#### Step 1 — Find your VPS IP

In GoDaddy: **My Products → VPS → Manage**. Note the **public IP address** (e.g. `123.45.67.89`).

#### Step 2 — Point the domain to the VPS

In GoDaddy: **My Products → Domains → DNS** for your domain.

Add or edit these records:

| Type | Name | Value        | TTL  |
|------|------|--------------|------|
| A    | @    | YOUR_VPS_IP  | 600  |
| A    | www  | YOUR_VPS_IP  | 600  |

Remove conflicting A records pointing elsewhere. DNS can take 15 minutes to a few hours to propagate.

Verify (from your Mac):

```bash
dig +short yourdomain.com
```

It should return your VPS IP.

#### Step 3 — SSH into the VPS

GoDaddy provides root login details (email or VPS panel). From your computer:

```bash
ssh root@YOUR_VPS_IP
```

First-time setup on the server (Ubuntu/Debian):

```bash
apt update && apt upgrade -y
apt install -y nginx git curl
```

Install Node.js 20 (needed only to build the site):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # should show v20.x
```

Optional but recommended — create a deploy user:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /var/www/numaiq
chown -R deploy:deploy /var/www/numaiq
```

#### Step 4 — Upload the project

**Option A — Git (recommended)**

On the VPS as `deploy`:

```bash
cd /var/www/numaiq
git clone https://github.com/YOUR_ORG/numa-ai-public.git .
```

**Option B — SCP from your Mac**

```bash
cd /Users/bornajerkoivc/Documents/GitHub/numa-ai-public
npm run build   # optional local test first
scp -r . deploy@YOUR_VPS_IP:/var/www/numaiq
```

#### Step 5 — Build on the server

Replace `yourdomain.com` with your actual domain (no `https://`, no trailing slash):

```bash
cd /var/www/numaiq
npm ci
VITE_SITE_URL=https://yourdomain.com npm run build
```

This creates `/var/www/numaiq/dist` with the site, `og_image.png`, and generated `robots.txt` / `sitemap.xml`.

#### Step 6 — Configure nginx

```bash
sudo cp /var/www/numaiq/deploy/nginx.conf.example /etc/nginx/sites-available/numaiq
sudo nano /etc/nginx/sites-available/numaiq
```

Replace `YOUR_DOMAIN.com` with your domain in both `server_name` lines.

Enable the site and test:

```bash
sudo ln -sf /etc/nginx/sites-available/numaiq /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default   # optional, removes default page
sudo nginx -t
sudo systemctl reload nginx
```

Open `http://yourdomain.com` — you should see the site.

#### Step 7 — HTTPS with Let's Encrypt (free)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts (enter email, agree to terms). Certbot updates nginx for HTTPS and sets up auto-renewal.

Test renewal:

```bash
sudo certbot renew --dry-run
```

#### Step 8 — Firewall (recommended)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

#### Updating the site later

After pushing changes to git, on the VPS:

```bash
cd /var/www/numaiq
git pull
VITE_SITE_URL=https://yourdomain.com npm run build
```

Or use the helper script:

```bash
chmod +x /var/www/numaiq/deploy/deploy.sh
/var/www/numaiq/deploy/deploy.sh yourdomain.com
```

No nginx restart needed unless you change nginx config.

#### Troubleshooting

| Problem | Fix |
|---------|-----|
| GoDaddy parking page still shows | Wait for DNS; clear browser cache; verify A records |
| 502 / blank page | Check `dist/` exists: `ls /var/www/numaiq/dist` |
| `/privacy` returns 404 | Ensure nginx has `try_files $uri $uri/ /index.html;` |
| Wrong social preview image | Rebuild with correct `VITE_SITE_URL`; test at opengraph.xyz |
| Permission errors on build | `sudo chown -R deploy:deploy /var/www/numaiq` |

#### Checklist before go-live

- [ ] `VITE_SITE_URL` matches your live domain (with `https://`)
- [ ] Site loads at `https://yourdomain.com`
- [ ] `/privacy` and `/terms` work when refreshed directly
- [ ] `https://yourdomain.com/og_image.png` loads in browser
- [ ] Favicon appears in browser tab


| Route | Description |
|-------|-------------|
| `/` | Marketing homepage |
| `/privacy` | Privacy Policy |
| `/terms` | Terms and Conditions |

## SEO & Metadata

`index.html` includes Open Graph, Twitter Card, JSON-LD organization schema, and canonical URLs. Update `VITE_SITE_URL` before publishing so social previews resolve correctly.

Assets in `public/`:
- `og_image.png` — Open Graph / social share image (1200×630)
- `favicon.ico` — Browser tab icon

Brand assets source files live in `resources/`.
