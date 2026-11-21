# AI Gateway realtime speech-to-speech

Node.js example that mints an AI Gateway realtime token for
`spacexai/grok-voice-think-fast-2.0`, opens a WebSocket session, sends a text
prompt, prints transcript deltas, and writes a playable WAV from PCM16 audio
deltas.

> Note: `xai/grok-voice-think-fast-1.0` is rejected by the Gateway WebSocket
> endpoint (`Model ... is not available over WebSocket`). Use the live
> `spacexai/grok-voice-think-fast-2.0` model instead.

## Setup

1. Copy `.env.local.example` to `.env.local` and set `AI_GATEWAY_API_KEY`.
2. Install deps: `npm install`
3. Run: `npm start` (or `npx tsx realtime.ts`)

Output is written to `realtime-output.wav`.
