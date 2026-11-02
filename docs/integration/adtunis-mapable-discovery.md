# Adtunis–MapAble discovery evidence

**Date:** 2026-11-03 (Australia/Sydney)  
**Workspace inspected:** `ausdisau/mapableau-new` (historical/migrated; canonical destination documented as `ausdisau/MapAble` `apps/web`)  
**External sources:** uploaded `Adtunis_43c8.zip`, `DiverseSpeechEngine_*.zip`; org repos via GitHub API

Classification key: **verified implemented** | **partially implemented** | **proposed** | **absent**. Repository config is not treated as proof of production deployment.

## Capability matrix

| Capability | Status | Evidence |
|---|---|---|
| Adtunis product (upload) | Verified implemented (standalone demo) | Replit workspace: Live Speech, Calibration, Corrections, Profiles, Consent, Accessibility, Bridge, Providers, Model Lab; `applyAction` state machine; `SpeechModelProvider`; OpenAPI; `adtunis.bridge.v1` |
| Adtunis in MapAble tree (pre-integration) | Absent | Zero `adtunis` matches in mapableau-new before this branch |
| Adtunis auth | Partially implemented / incompatible | Clerk (`@clerk/express`); MapAble uses NextAuth — adapter required |
| Adtunis persistence | Partially implemented (demo) | Drizzle `demoWorkspaces` JSON blob |
| Adtunis self-hosted ASR | Proposed / fail-closed | Requires `ADTUNIS_ASR_APPROVED` + private endpoint; default blocked |
| Adtunis cloud/vendor ASR | Proposed / mock only | Model Lab providers simulated; AU deny-by-default |
| DiverseSpeechEngine (upload) | Partially implemented (standalone) | Browser Web Speech + MediaRecorder + calibration/contribution (SpeechBridge) |
| `ausdisau/DiverseSpeech` GitHub | Absent / archive stub | Empty public repo; amalgamation docs mark Archive |
| `ausdisau/Aditunis` | Research reference | Google Euphonia audiotool fork (Firebase) |
| MapAble NextAuth + optional OAuth/Keycloak | Verified implemented | `app/api/auth/[...nextauth]/*`, `lib/auth/oauth-providers.ts` |
| Neon | DB host only (not IdP) | `.env.example`, Prisma `DATABASE_URL` |
| Consent + receipts + audit | Verified implemented | `lib/consent/*`, `lib/audit/audit-event-service.ts` |
| Messaging | Verified implemented | `lib/messages/message-service.ts`, `/api/messages/*` |
| AAC passport / voice intents | Partially implemented | CareOS Phase 13; platform browser speech stub; VoiceCommandsDemo is not a live mic loop |
| Chatbot browser mic | Verified (separate UX) | `client/src/components/chatbot-widget/ChatTab.tsx` — fills input, does not auto-send |
| Replit OpenAI STT | Verified (legacy twin) | `server/replit_integrations/audio` `gpt-4o-mini-transcribe` — not Adtunis Core |
| Vue apps | Absent | React/Next only |
| Production deployment | Config only | `vercel.json`, CI, infra — not production proof |

## Blockers and unresolved decisions

1. Canonical port to `ausdisau/MapAble` `apps/web` still required after this branch.
2. Live self-hosted ASR endpoint, region, retention and processing arrangements not approved.
3. No authoritative AU cloud-region allowlist for vendor ASR (Adtunis starts deny-by-default).
4. Clerk cannot be co-hosted; identity remapping is NextAuth-only.
5. Vue consumers do not exist in this monorepo (stubs only).
6. HIPAA applicability not assumed for this Australian disability-services context.

## Integration approach (this branch)

Adapt Adtunis domain into MapAble packages and `/api/v1/adtunis/*`, keep NextAuth/consent/messaging as systems of record, ship Care compose → confirm → deliver vertical slice with labelled mock messaging when live delivery is unavailable.
