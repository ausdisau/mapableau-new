# Wix integration — mapabl.au

The MapAble marketing site at [https://www.mapabl.au](https://www.mapabl.au) runs on Wix. This app (Next.js on Vercel) hosts the **Provider Finder** and public search APIs.

## What is configured in code

| Capability | Detail |
| --- | --- |
| **CORS** | `https://mapabl.au`, `https://www.mapabl.au`, and `mapable.com.au` hosts may call `GET /api/search/autocomplete` from the browser (Wix Velo `fetch`). |
| **Embed URL** | `{APP_URL}/embed/provider-finder` — minimal chrome, safe to iframe on Wix. |
| **Framing** | `/embed/*` sends `Content-Security-Policy: frame-ancestors` allowing Wix editor and live site hosts. |

Set `NEXT_PUBLIC_APP_URL` in production to your deployed app URL (e.g. the Vercel deployment hostname).

Optional env (see `.env.example`):

- `WIX_ALLOWED_ORIGINS` — comma-separated extra CORS origins (preview domains).
- `WIX_FRAME_ANCESTORS` — extra CSP `frame-ancestors` tokens for embed routes.

## Embed Provider Finder on a Wix page

1. In the Wix Editor, add an **HTML iframe** (or Embed → Custom embed).
2. Set the source URL to your deployed embed path, for example:

   `https://YOUR-APP.vercel.app/embed/provider-finder`

3. Suggested iframe size: width `100%`, height `900px` (adjust for your layout).
4. Publish the site.

Deep links from Wix buttons can point to the full app:

- Provider Finder (full layout): `{APP_URL}/provider-finder`
- Home search: `{APP_URL}/`

## Wix Velo — autocomplete from a custom element

Use this only on pages where you need live suggestions without the full iframe.

```javascript
import { fetch } from 'wix-fetch';

const MAPABLE_API = 'https://YOUR-APP.vercel.app';

export async function mapableAutocomplete(query) {
  const url = `${MAPABLE_API}/api/search/autocomplete?q=${encodeURIComponent(query)}&context=homepage&field=all`;
  const res = await fetch(url, { method: 'get' });
  if (!res.ok) throw new Error(`MapAble search failed: ${res.status}`);
  return res.json();
}
```

The request origin must be `https://www.mapabl.au` or `https://mapabl.au` (or a host listed in `WIX_ALLOWED_ORIGINS`).

## Manual checks after deploy

1. Open `https://www.mapabl.au` and confirm the iframe loads the embed URL without a blank frame or “refused to connect”.
2. In browser devtools on the Wix page, call the autocomplete URL and confirm `Access-Control-Allow-Origin` matches the Wix origin.
3. From the embed, run a provider search and open a profile link (should navigate inside the iframe or set `target="_top"` if you customize links).

## Related code

- `lib/integrations/wix/config.ts` — site URLs, env parsing
- `lib/integrations/wix/cors.ts` — CORS allowlist and middleware helpers
- `middleware.ts` — OPTIONS + CORS for autocomplete
- `app/embed/provider-finder/page.tsx` — iframe-friendly finder
