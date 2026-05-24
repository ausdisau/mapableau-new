# Accessible voice and word prediction

MapAble supports optional **voice input** and **word prediction** on key compose surfaces. Both features follow accessibility-first principles: explicit user control, review before submit, and privacy-friendly defaults.

## User preferences

Set preferences under **Dashboard → Accessibility → Digital interface**:

| Preference | Effect |
|------------|--------|
| Word prediction while typing | Shows phrase/word suggestions while typing in Copilot, messages, booking notes, and voice transcript review |
| Show voice input controls | Shows an inline microphone control beside supported text fields |
| Third-party STT consent | Allows cloud speech-to-text adapters when configured (mock mode does not require this) |

Preferences are stored in `accessibilityProfile.digitalPreferences` (JSON). Voice consent is also stored in `VoiceUserPreference.consentThirdPartyStt`.

## Word prediction

- **API:** `GET /api/word-prediction/suggest?q=&context=&caret=&limit=` (session required, rate-limited)
- **Contexts:** `copilot`, `message`, `booking`, `general`
- **Data:** Static curated corpus plus optional `customPhrases` on the profile (up to 50)
- **UI:** `AccessibleWordPredictionField` — combobox listbox, keyboard navigation, `aria-live` suggestion count
- **No external ML** in v1 — works offline-capable with the static corpus

### Integrated surfaces

- Ask MapAble (`CopilotPanel`)
- Messages (`MessageComposer`)
- Booking notes (`BookingWizard`)
- Voice transcript review (`TranscriptReviewEditor`)

## Voice input

See [voice-recognition.md](./voice-recognition.md) for the full voice layer.

**Inline capture** (`VoiceInlineCapture`) records audio, transcribes via `/api/voice/transcribe`, and appends text to the field. Nothing is auto-submitted.

**Dashboard:** `/dashboard/voice` for full session flow with review and draft creation.

### Environment variables

```bash
VOICE_ADAPTER_MODE=mock
VOICE_DELETE_AUDIO_AFTER_TRANSCRIBE=true
VOICE_MAX_AUDIO_BYTES=10485760
VOICE_ALLOW_THIRD_PARTY=false
VOICE_SPEACHES_API_URL=
VOICE_FASTER_WHISPER_API_URL=
```

Use `VOICE_ADAPTER_MODE=mock` in development and CI.

## Verification

```bash
pnpm prisma migrate deploy
pnpm test tests/voice-recognition.test.ts tests/word-prediction.test.ts
```

Manual checks: keyboard-only suggestion selection, screen reader announces suggestion count, mic hidden when voice preference is off.
