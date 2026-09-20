# Speechify text-to-speech

MapAble integrates Speechify as an optional, user-initiated read-aloud service.

## Security boundary

- The Speechify API key is server-side only.
- Set it as `SPEECHIFY_API_KEY`; never prefix it with `NEXT_PUBLIC_`.
- Never commit the key or paste it into prompts, issue bodies, logs, screenshots, or documentation.
- The browser calls MapAble's authenticated `POST /api/speechify/tts` route.
- MapAble sends text to Speechify only after the user activates a read-aloud control.
- Audio responses use `Cache-Control: private, no-store`.
- Generated audio is not persisted by this integration.

## Local setup

```bash
export SPEECHIFY_API_KEY=<your rotated key>
pnpm dev
```

For persistent local development, store the key only in an untracked local environment file.

## Vercel

Add `SPEECHIFY_API_KEY` as an encrypted environment variable in Vercel for each environment where read-aloud is enabled, then redeploy.

Do not create a `NEXT_PUBLIC_SPEECHIFY_API_KEY` variable.

The dashboard only renders the Speechify control when the server can see a non-empty `SPEECHIFY_API_KEY`.

## API defaults

- SDK: `@speechify/api@4.0.1`
- Base API: `https://api.speechify.ai`
- Model: `simba-3.2`
- Voice: `geffen_32`
- Format: MP3
- Input cap: 2,000 characters
- SDK API version: `2026-09-13`

## Speechify Docs MCP

Repository coding-tool configuration registers:

```text
https://mcp.speechify.ai/mcp
```

as `ask-speechify` in both `.cursor/mcp.json` and `.mcp.json`.

After the coding tool reloads MCP configuration, verify with:

```text
How do I stream text-to-speech audio with the Speechify API?
```

The answer should be grounded in and cite Speechify documentation.
