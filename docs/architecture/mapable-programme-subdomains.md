# MapAble programme subdomains

Status: development — middleware rewrites only; **no production DNS attach**.

## Adapters in this slice

| Host | Path | Module |
| --- | --- | --- |
| `signal.mapable.com.au` | `/signal` | `lib/signal/host-routing.ts` |
| `accessimart.mapable.com.au` | `/marketplace` (+ `/review` → review) | `lib/marketplace/accessimart-host-routing.ts` |
| `marketplace.mapable.com.au` | `/marketplace` | registry |
| `ecosystem.mapable.com.au` | `/ecosystem` | registry |
| `care.mapable.com.au` | `/care` | registry |
| `transport.mapable.com.au` | `/transport` | registry |
| `employment.mapable.com.au` | `/employment` | registry |

Shared factory: `lib/platform/subdomain-route-adapter.ts`  
Registry + middleware match: `lib/platform/mapable-subdomain-registry.ts`

Existing dedicated adapters (unchanged): Labs (`labs.mapable.com.au`), Peers (`peer.mapable.com.au`).

## DNS / platform mapping

See `docs/architecture/mapable-subdomain-dns-cloudflare-vercel-neon.md` for Cloudflare CNAME → Vercel domain attach and shared Neon `DATABASE_URL` / `DIRECT_URL` guidance.
