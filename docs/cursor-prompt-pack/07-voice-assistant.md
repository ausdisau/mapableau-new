# MapAble Voice Assistant — Cursor prompt pack

## 1. Product purpose

Voice-first interface for intake, reminders, and navigation. **Draft only until participant confirms.**

## 2. User roles

| Role | Capabilities |
|------|----------------|
| Participant | Voice sessions, prefs, confirm drafts |
| Nominee | If granted: confirm on behalf |
| System | STT/TTS adapters |

## 3. MVP features

- Start `VoiceSession` → record transcript via adapter stub
- Parse intent → `VoiceIntakeDraft` (booking type, slots, addresses)
- Spoken prompt playback (TTS adapter stub / Web Speech API fallback)
- Confirmation screen listing draft fields
- On confirm → call existing Care/Transport create APIs
- `VoicePreference` (rate, voice id, confirm always)
- Accessible fallback: full keyboard form mirror

## 4. Later features

- Wake word, offline mode
- Multi-language
- Voice navigation for dashboard

## 5. Database tables

`VoiceSession`, `VoiceTranscript`, `VoiceIntakeDraft`, `VoiceCommand`, `VoicePreference`, `ConfirmationEvent`

## 6. API routes

```
POST /api/voice/sessions
POST /api/voice/sessions/[id]/transcript
POST /api/voice/drafts/[draftId]/confirm
POST /api/voice/drafts/[draftId]/discard
GET/PUT /api/voice/preferences
```

## 7. Frontend

- `app/dashboard/voice/page.tsx`
- `components/voice/VoiceCaptureButton`, `DraftReviewPanel`, `ConfirmBar`, `FallbackForm`

## 8. Integrations

AI Intake, Care, Transport, Notifications (reminder playback), Participant Portal.

## 9. Accessibility

- Visual transcript always visible
- Confirm button ≥44px, not voice-only confirm
- Cancel anytime

## 10. Privacy

- Transcripts retained 30 days unless user deletes
- **Rule:** No auto-send messages or bookings without `ConfirmationEvent`

## 11. Audit

`voice.session.started`, `voice.draft.created`, `voice.draft.confirmed`, `voice.draft.discarded`

## 12. Tests

- Draft without confirm does not create booking
- Confirm creates exactly one booking

## 13. Seed

1 session, 1 draft booking, 0 confirmations.

**Branch:** `cursor/voice-mvp-ce11`
