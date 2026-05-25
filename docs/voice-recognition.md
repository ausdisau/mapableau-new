# Voice recognition layer

Optional speech-to-text for drafting bookings, messages, and logs. Voice **never auto-submits** — users must review, edit, and confirm.

## Paths (repo layout)

| Spec | Implemented |
|------|-------------|
| `src/types/voice.ts` | [`types/voice.ts`](../types/voice.ts) |
| `src/lib/voice/*` | [`lib/voice/`](../lib/voice/) |
| `src/components/voice/*` | [`components/voice/`](../components/voice/) |

## Adapters

| Adapter | Env | Notes |
|---------|-----|-------|
| `mock` | `VOICE_ADAPTER_MODE=mock` | Default for local dev |
| `speaches` | `VOICE_SPEACHES_API_URL` | Self-hosted Speaches-compatible server |
| `faster_whisper` | `VOICE_FASTER_WHISPER_API_URL` | Placeholder HTTP hook |
| `whisper_cpp` | `VOICE_WHISPER_CPP_API_URL` | Future offline/mobile |
| `vosk` | `VOICE_VOSK_API_URL` | Offline placeholder |

## API

- `POST /api/voice/sessions`
- `POST /api/voice/transcribe` (multipart audio)
- `POST /api/voice/sessions/[id]/text` (paste/AAC fallback)
- `GET /api/voice/sessions/[id]`
- `PATCH /api/voice/transcripts/[id]`
- `POST /api/voice/transcripts/[id]/confirm`
- `POST /api/voice/transcripts/[id]/discard`
- `POST /api/voice/transcripts/[id]/create-draft`

## UI

[`/dashboard/voice`](/dashboard/voice) — full recorder panel with privacy notice, text fallback, and review editor.

## Privacy

- Audio deleted after transcription by default (`VOICE_DELETE_AUDIO_AFTER_TRANSCRIBE=true`)
- Third-party STT requires user preference `consentThirdPartyStt`
- Audit events for session, transcription, confirm, discard, draft
