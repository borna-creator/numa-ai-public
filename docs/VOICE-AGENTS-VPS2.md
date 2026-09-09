# Multi-language voice agents on VPS 2

Run **one LiveKit server** and **three agent worker processes** (English, French, Arabic) on VPS 2. The NumaIQ worker mints tokens and dispatches the correct agent by language.

## Architecture

```
Super admin UI  →  VPS1 /api/voice  →  VPS2 numaiq-worker (tokens + dispatch)
Browser WebRTC  →  VPS2 LiveKit server (:7880)
Three agent processes  →  register as numa-agent-en | numa-agent-fr | numa-agent-ar
```

Later, move LiveKit + agents to a dedicated VPS by changing `LIVEKIT_URL` / `LIVEKIT_PUBLIC_URL` in the worker `.env`.

---

## 1. Start LiveKit server (VPS 2)

Your worker repo is at `/var/www/worker`. LiveKit files live in **`deploy/livekit/`** inside that repo (not the main numa-ai-public repo).

```bash
cd /var/www/worker
git pull

mkdir -p /opt/livekit
cp deploy/livekit/docker-compose.yml /opt/livekit/
cp deploy/livekit/livekit.yaml.example /opt/livekit/livekit.yaml
```

Note: the path is **`/opt/livekit`** (letter **o**), not `/otp/livekit`.

# Generate API key + secret
docker run --rm livekit/livekit-server generate-keys
# Paste into livekit.yaml under keys: and into worker .env

cd /opt/livekit
docker compose up -d
curl -s http://127.0.0.1:7880 && echo " LiveKit OK"
```

Open firewall (if needed):

- TCP `7880`, `7881`
- UDP `50000-50100` (WebRTC media — smaller range avoids Docker proxy issues)

If Docker fails with `failed to start userland proxy` on UDP ports, use the **host networking** compose file (included in `deploy/livekit/docker-compose.yml`) and set `redis: address: 127.0.0.1:6379` in `livekit.yaml`.

---

## 2. Worker `.env` (VPS 2 — `/var/www/worker/.env`)

```env
# Internal URL for server SDK (dispatch, tokens)
LIVEKIT_URL=ws://127.0.0.1:7880

# Browser URL — use public wss when proxied; for testing, VPS IP:
# LIVEKIT_PUBLIC_URL=wss://YOUR_VPS2_IP:7880
# Production: proxy via nginx on numa-iq.com (see below)

LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=your_secret

# Agent names — must match each running agent worker
LIVEKIT_AGENT_ENGLISH=numa-agent-en
LIVEKIT_AGENT_FRENCH=numa-agent-fr
LIVEKIT_AGENT_ARABIC=numa-agent-ar
```

Restart worker after changes:

```bash
sudo systemctl restart numaiq-worker
sudo journalctl -u numaiq-worker -n 15 --no-pager
# Expect: Voice agent ENGLISH: numa-agent-en, etc.
```

---

## 3. Run three agent workers

Use **your existing LiveKit agent** (Python or Node). Start **three separate processes** with different agent name and language.

### Example (Python LiveKit Agents)

```bash
# Terminal / systemd instance 1 — English
export LIVEKIT_URL=ws://127.0.0.1:7880
export LIVEKIT_API_KEY=...
export LIVEKIT_API_SECRET=...
export AGENT_LANGUAGE=english
python agent.py dev --name numa-agent-en

# Instance 2 — French
export AGENT_LANGUAGE=french
python agent.py dev --name numa-agent-fr

# Instance 3 — Arabic
export AGENT_LANGUAGE=arabic
python agent.py dev --name numa-agent-ar
```

Agent `--name` **must match** `LIVEKIT_AGENT_*` in worker `.env`.

### systemd template (optional)

Copy `deploy/livekit/numa-voice-agent@.service.example` to `/etc/systemd/system/` and enable:

```bash
sudo systemctl enable --now numa-voice-agent@en
sudo systemctl enable --now numa-voice-agent@fr
sudo systemctl enable --now numa-voice-agent@ar
```

Edit the service file to point at your agent binary and env file.

---

## 4. HTTPS / public WebSocket (required for production)

The platform runs on **https://numa-iq.com**. Browsers need **wss://** with a valid certificate.

**Option A — subdomain** (recommended later on dedicated VPS):

- `voice.numa-iq.com` → VPS2:7880 with TLS (Caddy/nginx)

**Option B — path proxy on VPS1** (interim):

```nginx
location /livekit/ {
  proxy_pass http://VPS2_IP:7880/;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

Then set on VPS2 worker:

```env
LIVEKIT_PUBLIC_URL=wss://numa-iq.com/livekit
LIVEKIT_URL=ws://127.0.0.1:7880
```

---

## 5. Deploy app changes

**VPS 2:** `git pull && npm ci && sudo systemctl restart numaiq-worker`

**VPS 1:** `git pull && npm run build && sudo systemctl restart numaiq-api`

Super admin → **Voice Assistant** → pick **English / French / Arabic** → Start conversation.

**VPS 1 (first deploy with prompts):** run the DB migration before restarting the API:

```bash
cd /var/www/numaiq
git pull
npx prisma migrate deploy
npm run build
sudo systemctl restart numaiq-api
```

---

## 6. Editable agent prompts (Super admin UI)

Prompts are stored in **VPS1 Postgres** and sent to agents on each new session via LiveKit dispatch **metadata** — no agent restart needed after edits.

### Flow

```
Super admin UI  →  PATCH /api/voice/prompts/:language  →  Postgres
Start session   →  worker createDispatch(metadata: { systemPrompt, greetingPrompt })
Python agent    →  reads ctx.job.metadata per job
```

### UI

Super admin → **Voice Assistant** → **Agent prompts** card:

- Edit **system prompt** (behavior / language rules)
- Edit **greeting prompt** (first spoken message)
- **Save** or **Reset to default** per language

### Wire prompts into Python agents (VPS 2)

Copy the loader from the worker repo:

```bash
cp /var/www/worker/deploy/voice-agent/prompt_loader.py /var/www/voice-agent/
```

In each `agent_en.py`, `agent_fr.py`, `agent_ar.py` entrypoint:

```python
from prompt_loader import load_session_prompts

# Inside your agent entrypoint (after ctx is available):
prompts = load_session_prompts(
    ctx.job.metadata,
    default_system=YOUR_FILE_DEFAULT_SYSTEM,
    default_greeting=YOUR_FILE_DEFAULT_GREETING,
)

# Use prompts.system for Agent(instructions=...)
# Use prompts.greeting for the on_enter / first reply
```

Keep your file-level defaults as fallbacks when metadata is empty (e.g. manual `lk dispatch` without prompts).

Restart agent services after updating Python files:

```bash
sudo systemctl restart numa-voice-agent-en numa-voice-agent-fr numa-voice-agent-ar
```

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| Language shows unavailable | Worker logs for `Voice agent FRENCH: not configured` — set `LIVEKIT_AGENT_FRENCH` |
| Connects, no assistant | Agent process running? Name matches dispatch? Agent logs |
| No audio | Browser mic permission; `room.startAudio()` (already in UI); UDP ports open |
| Works on HTTP not HTTPS | Set `LIVEKIT_PUBLIC_URL` to wss behind TLS proxy |

Verify dispatch manually:

```bash
curl -s -H "x-worker-secret: $WORKER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"participantId":"test","participantName":"Test","language":"ENGLISH"}' \
  http://127.0.0.1:4000/voice/session
```
