# Caddie: Backend ↔ Frontend Gap Analysis

**Generated:** 2026-05-22  
**Backend:** caddie-core (FastAPI on Fly.dev)  
**Frontend:** caddie-app (Expo SDK 54 / React Native)

---

## Summary

The iOS app exposes **8 of 35+ backend capabilities**. The app currently covers the core queue loop (fetch → swipe → outcome → skip → snooze), morning brief, voice/text touch logging, push token registration, and health check. Everything else — vault, drip, signals, enrichment, intake, ask, audit, LinkedIn, admin, history, context, drafts, quota, and three-tier onboarding — has **no UI surface** in the app.

---

## Gap Table

| # | Feature | Backend Endpoint | App Screen / Component | Status |
|---|---------|-----------------|----------------------|--------|
| **CORE QUEUE** | | | | |
| 1 | Fetch action queue | `GET /api/queue` | `(tabs)/queue.tsx` via `QueueContext` → `api.getQueue()` | ✅ **Wired** |
| 2 | Log outcome | `POST /api/outcome` | `OutcomeModal` → `api.submitOutcome()` | ✅ **Wired** |
| 3 | Skip action | `POST /api/skip` | Swipe-left on `SwipeableActionCard` → `api.skip()` | ✅ **Wired** |
| 4 | Snooze action | `POST /api/snooze` | Swipe-up on card → `api.snooze()` | ✅ **Wired** |
| 5 | Morning brief / stats | `GET /api/queue` (reused) | `(tabs)/index.tsx` → `MorningBrief` component | ✅ **Wired** |
| **HEALTH / INFRA** | | | | |
| 6 | Health check | `GET /api/health` | `(tabs)/settings.tsx` → `api.health()` | ✅ **Wired** |
| 7 | Push token register | `POST /api/push-token` | `useNotifications` hook → `api.registerPushToken()` | ✅ **Wired** |
| 8 | Push token check | `GET /api/push-token` | — | ❌ **Not wired** |
| **CONVERSATION INGEST** | | | | |
| 9 | Text touch logging | `POST /api/conversation/ingest` | `VoiceCapture` component → `api.ingestConversation()` | ✅ **Wired** |
| 10 | Voice recording → transcription | (needs transcription pipeline) | `(tabs)/log.tsx` records audio but shows "coming in v1.1" alert | ⚠️ **Partial** — records audio, no transcription or upload |
| **CONTEXT & ASK** | | | | |
| 11 | Contact context lookup | `GET /api/context/{contact_id}` | `api.getContext()` exists in client.ts but **no UI calls it** | ❌ **Not wired** |
| 12 | Ask a question (NL Q&A) | `POST /api/ask` | Not in `client.ts` at all, no UI | ❌ **Not wired** |
| 13 | Action draft (email/SMS) | `GET /api/actions/{id}/draft` | `api.getDraft()` exists in client.ts but **no UI calls it** | ❌ **Not wired** |
| **HISTORY & OUTCOMES** | | | | |
| 14 | Today's completed actions | `GET /api/history` | No screen, no API call | ❌ **Not wired** |
| 15 | Quota pacing | `GET /api/quota` | Quota type exists; `QueueContext` stores `data.quota` but **no UI renders it** | ⚠️ **Partial** — data fetched, not displayed |
| 16 | Auto-resolve (Gmail/Calendar) | `GET /api/auto-resolve` | No screen, no API call | ❌ **Not wired** |
| **VAULT (DOCUMENT LAYER)** | | | | |
| 17 | Upload file to vault | `POST /api/vault/upload` | No screen, no API call | ❌ **Not wired** |
| 18 | List uploads | `GET /api/vault/uploads` | No screen, no API call | ❌ **Not wired** |
| 19 | Delete upload | `DELETE /api/vault/uploads/{doc_id}` | No screen, no API call | ❌ **Not wired** |
| 20 | Vault semantic search | `GET /api/vault/search` | No screen, no API call | ❌ **Not wired** |
| 21 | Vault sync (reindex) | `POST /api/vault/sync` | No screen, no API call | ❌ **Not wired** |
| 22 | Vault status | `GET /api/vault/status` | No screen, no API call | ❌ **Not wired** |
| 23 | Vault web UI | `GET /vault` (HTML page) | Not applicable (web-only) | N/A |
| 24 | Legacy vector search | `GET /api/vectors/search` | No screen, no API call | ❌ **Not wired** |
| **DRIP MESSAGES** | | | | |
| 25 | List pending drip drafts | `GET /api/drip` | No screen, no API call | ❌ **Not wired** |
| 26 | Approve drip draft | `POST /api/drip/{id}/approve` | No screen, no API call | ❌ **Not wired** |
| 27 | Skip drip draft | `POST /api/drip/{id}/skip` | No screen, no API call | ❌ **Not wired** |
| 28 | Create manual trigger | `POST /api/drip/trigger` | No screen, no API call | ❌ **Not wired** |
| 29 | Send approved drips | `POST /api/drip/send` | No screen, no API call | ❌ **Not wired** |
| **SIGNALS** | | | | |
| 30 | Fetch external signals | `GET /api/signals` | No screen, no API call | ❌ **Not wired** |
| **ENRICHMENT** | | | | |
| 31 | Company enrichment (Apollo) | `GET /api/enrichment/{company}` | No screen, no API call | ❌ **Not wired** |
| 32 | Bulk enrich contacts | `POST /api/enrich` | No screen, no API call | ❌ **Not wired** |
| **INTAKE / ONBOARDING** | | | | |
| 33 | Start intake session | `POST /api/intake/start` | No screen, no API call | ❌ **Not wired** |
| 34 | Respond in intake | `POST /api/intake/respond` | No screen, no API call | ❌ **Not wired** |
| 35 | Finish intake session | `POST /api/intake/finish` | No screen, no API call | ❌ **Not wired** |
| **VOICE PROFILE** | | | | |
| 36 | Voice profile status | `GET /api/voice-profile` | No screen, no API call | ❌ **Not wired** |
| **AUDIT / TRANSPARENCY** | | | | |
| 37 | Audit log (timeline) | `GET /api/audit/log` | No screen, no API call | ❌ **Not wired** |
| 38 | Audit (data sources) | `GET /api/audit` | No screen, no API call | ❌ **Not wired** |
| **LINKEDIN** | | | | |
| 39 | LinkedIn OAuth start | `GET /linkedin/auth` | No screen, no API call | ❌ **Not wired** |
| 40 | LinkedIn OAuth callback | `GET /linkedin/callback` | No screen, no API call | ❌ **Not wired** |
| 41 | Import LinkedIn connections | `POST /linkedin/import/connections` | No screen, no API call | ❌ **Not wired** |
| 42 | Import LinkedIn messages | `POST /linkedin/import/messages` | No screen, no API call | ❌ **Not wired** |
| **THREE-TIER ONBOARDING** | | | | |
| 43 | Three-tier person onboard | `POST /api/three_tier/onboard` | No screen, no API call | ❌ **Not wired** |
| **AUTH** | | | | |
| 44 | Issue bearer token | `POST /api/auth/issue` | No auth flow — app uses hardcoded `X-Caddie-Rep-Id` header | ❌ **Not wired** |
| **ADMIN** | | | | |
| 45 | Create API key | `POST /api/admin/keys` | No admin UI | ❌ **Not wired** (admin-only) |
| 46 | List API keys | `GET /api/admin/keys/{rep_id}` | No admin UI | ❌ **Not wired** (admin-only) |
| 47 | Revoke API key | `POST /api/admin/keys/revoke` | No admin UI | ❌ **Not wired** (admin-only) |
| **WEBHOOKS / INTERNAL** | | | | |
| 48 | SMS inbound webhook | `POST /sms/inbound` | Not applicable (server-to-server) | N/A |
| 49 | Loop process | `POST /process` | Not applicable (server-to-server) | N/A |
| 50 | Backup status (ops) | `GET /internal/v1/ops/backup-status` | Not applicable (internal ops) | N/A |

---

## Wiring Scorecard

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Wired | 8 | 19% |
| ⚠️ Partial | 2 | 5% |
| ❌ Not wired | 32 | 76% |
| N/A (server-only / web-only) | 4 | — |

---

## Priority Gaps (User-Facing Features With No UI)

### P0 — Critical for first real use
1. **Auth flow** (`POST /api/auth/issue`) — App hardcodes rep ID in headers; no token-based auth. First thing to break in multi-user.
2. **Contact context** (`GET /api/context/{contact_id}`) — API client method exists but no screen. Tapping a contact name is a no-op (`TODO: open contact sheet`).
3. **Action drafts** (`GET /api/actions/{id}/draft`) — API client method exists but no compose/preview screen. User can't see suggested email/SMS text.
4. **Ask / Q&A** (`POST /api/ask`) — Not even in the API client. Core differentiator with no surface.

### P1 — High value, near-term
5. **History / completed today** (`GET /api/history`) — No way to review what you've done.
6. **Quota display** — Data is fetched via queue response and stored in context, but no component renders it.
7. **Vault upload** (`POST /api/vault/upload`) — Document ingestion has no mobile surface; only a web drag-and-drop page exists.
8. **Vault search** (`GET /api/vault/search`) — Semantic search has no UI.
9. **Signals feed** (`GET /api/signals`) — News/trigger signals have no screen.
10. **Drip review** (`GET /api/drip`, approve, skip) — Relationship drip messages can't be reviewed or approved from the app.

### P2 — Important but deferrable
11. **Intake onboarding** (3 endpoints) — Conversational data import has no mobile UI.
12. **Voice profile** (`GET /api/voice-profile`) — No way to see voice match confidence.
13. **Enrichment** (Apollo lookup/bulk) — No UI to trigger or view enrichment.
14. **Audit / transparency** (2 endpoints) — No way to see data sources or scoring weights.
15. **LinkedIn import** (4 endpoints) — OAuth + CSV import has no mobile flow.
16. **Voice transcription** — Log screen records audio but can't transcribe or submit it.

### P3 — Admin / Internal
17. **Admin key management** (3 endpoints) — Admin-only, acceptable to leave CLI/API-only.
18. **Three-tier onboarding** — Advanced data-layer feature, can stay API-only for now.

---

## App Screen Inventory

| Tab | Screen File | What It Does |
|-----|------------|--------------|
| Brief | `app/(tabs)/index.tsx` | Morning summary — action counts, revenue, priority list |
| Queue | `app/(tabs)/queue.tsx` | Swipeable action cards (done/skip/snooze), outcome modal |
| Log | `app/(tabs)/log.tsx` | Voice recording + text input for conversation ingest |
| Settings | `app/(tabs)/settings.tsx` | Server status, push toggle, version info, export placeholder |

**Missing screens needed:**
- Contact detail / context sheet
- Ask / Q&A input
- Draft preview (email/SMS compose)
- History / completed actions
- Vault (upload + search)
- Signals feed
- Drip review queue
- Intake onboarding wizard
- Auth / login flow

---

## API Client Coverage

Methods in `src/api/client.ts`:

| Method | Backend Endpoint | Called by UI? |
|--------|-----------------|---------------|
| `getQueue()` | `GET /api/queue` | ✅ Yes |
| `submitOutcome()` | `POST /api/outcome` | ✅ Yes |
| `skip()` | `POST /api/skip` | ✅ Yes |
| `snooze()` | `POST /api/snooze` | ✅ Yes |
| `ingestConversation()` | `POST /api/conversation/ingest` | ✅ Yes |
| `health()` | `GET /api/health` | ✅ Yes |
| `getContext()` | `GET /api/context/{id}` | ❌ Dead code |
| `getDraft()` | `GET /api/actions/{id}/draft` | ❌ Dead code |
| `registerPushToken()` | `POST /api/push-token` | ✅ Yes |

**Not in client.ts at all:** ask, history, quota, auto-resolve, vault (5 endpoints), drip (5 endpoints), signals, enrichment (2), intake (3), voice-profile, audit (2), LinkedIn (4), three-tier, auth/issue, admin (3).

---

## Authentication Gap

The app uses `X-Caddie-Rep-Id: chris-kenney` header for all requests (hardcoded in constructor). The backend supports:
- Bearer token auth via `POST /api/auth/issue`
- API key auth via admin endpoints

The app has **no login screen, no token storage, no auth refresh**. This is the #1 infrastructure gap.
