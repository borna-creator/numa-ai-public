# Phase 2 — Worker contract & mock scoring

Phase 2 connects VPS 1 (this app) to an AI worker on VPS 2. The worker lives in **`vps2-worker/`** — a standalone package you deploy only on VPS 2. Phase 3 replaces mock STT/LLM with Nova + DeepSeek inside that folder.

## Architecture

```
Upload call (+ scorecard) on VPS 1
  → API creates ProcessingJob, status PROCESSING
  → POST job payload to WORKER_URL/jobs
Worker downloads audio via signed URL
  → transcribes + scores (mock for now)
  → POST results to /api/internal/jobs/:jobId/complete
VPS 1 stores transcript, criterion results, overall score → COMPLETED
```

## Environment (VPS 1 — API)

```env
WORKER_SECRET=<shared-secret>
WORKER_URL=http://<vps2-ip>:4000
API_DOMAIN=https://numa-iq.com
JOB_AUDIO_TOKEN_TTL_SEC=3600
```

`WORKER_SECRET` must match the worker service. `API_DOMAIN` must be the public URL the worker uses to fetch audio and post callbacks.

## Environment (VPS 2 — worker)

```env
WORKER_SECRET=<same-as-vps1>
WORKER_PORT=4000
```

On VPS 2, see [vps2-worker/README.md](../vps2-worker/README.md). Only `WORKER_SECRET` is required for the mock worker.

## Local development

```bash
cp .env.example .env
# Set WORKER_SECRET to any long random string

npm run docker:up
npm run db:migrate:deploy   # or db:migrate
npm run dev:all             # web + API + mock worker
```

Upload a call **with a scorecard selected**. Status moves `PENDING → PROCESSING → COMPLETED` with mock transcript and scores.

## API routes (worker-facing)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/internal/calls/:callId/audio?token=…` | Signed token |
| POST | `/api/internal/jobs/:jobId/complete` | Header `X-Worker-Secret` |

## Job payload (VPS 1 → worker)

```json
{
  "jobId": "…",
  "callId": "…",
  "organizationId": "…",
  "audioUrl": "https://numa-iq.com/api/internal/calls/{id}/audio?token=…",
  "callbackUrl": "https://numa-iq.com/api/internal/jobs/{jobId}/complete",
  "scorecard": {
    "id": "…",
    "name": "…",
    "language": "ENGLISH",
    "criteria": [
      {
        "id": "…",
        "label": "…",
        "description": "…",
        "questionType": "YES_NO",
        "weight": 1
      }
    ]
  }
}
```

## Callback payload (worker → VPS 1)

```json
{
  "status": "COMPLETED",
  "transcript": {
    "fullText": "…",
    "segments": [{ "speaker": "agent", "startSec": 0, "endSec": 4, "text": "…" }]
  },
  "results": [
    {
      "criterionId": "…",
      "value": "YES",
      "passed": true,
      "reasoning": "…"
    }
  ]
}
```

On failure: `{ "status": "FAILED", "errorMessage": "…" }`

## Deploy worker on VPS 2

Deploy **only** the `vps2-worker/` folder (not the full web app):

```bash
git clone <repo-url> && cd numa-ai-public/vps2-worker
npm ci
cp .env.example .env   # WORKER_SECRET must match VPS 1

sudo cp deploy/numaiq-worker.service /etc/systemd/system/
sudo systemctl enable --now numaiq-worker
```

Full steps: [vps2-worker/README.md](../vps2-worker/README.md)

Firewall: allow VPS 1 IP → VPS 2 port 4000. Allow VPS 2 → VPS 1 HTTPS for callbacks.

## User-facing

- Upload with scorecard → auto processing
- **Start scoring** / **Re-score call** on call detail
- Transcript, per-criterion scores, overall % when complete

## Phase 3

Replace `vps2-worker/src/mockPipeline.js` with Nova STT + DeepSeek v4 Flash on VPS 2. The job/callback contract stays the same.
