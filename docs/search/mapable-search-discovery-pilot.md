# MapAble Search: evidence-aware discovery pilot

Status: **IN DEVELOPMENT / PREVIEW ONLY** (21 November 2026). No production deployment or external-search activation is authorised by this pull request.

## Mission and product boundaries

Add one accessible `/search` entry point across Provider Finder, Care, Transport and Employment, without implying public worker verification or exposing participant, employer or provider private data. This first slice is **discovery only**, not booking, matching, funding approval, account creation or an NDIS digital-platform transaction.

Existing foundations inspected:

- `lib/search` interpretation, suggestions and provider search.
- `app/provider-finder` and `lib/provider/finder`.
- `lib/ingestion/ndis-providers-search.ts` imported directory index.
- `lib/tfnsw` transport adapters and `lib/jobs` employment workflows.
- `lib/api/ip-rate-limit.ts` process-local limiter (explicitly **not** multi-instance ready).

## Implemented bounded slice

- Public accessible GET `/search`: keyboard-friendly form, typed category/state/postcode selection, results list, evidence disclaimers, a no-match and an upstream-unavailable state.
- GET `/api/mapable-search?q=...&vertical=all|providers|care|transport|jobs&state=NSW&postcode=2000`: read-only, Zod-validated input, no-store response.
- Default OFF feature flag `MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED`. When OFF, only public MapAble module navigation is shown; when ON in authorised preview, queries the existing `ndis_providers` indexed snapshot using a limited read.
- Does not send the user's query to Exa, Parallel, an LLM or a crawler; no participant records or worker data are returned.
- Imported NDIS outlet status remains provenance-labelled and explicitly distinct from current Commission registration, worker screening, access, availability and competence.
- Demonstration/ambiguous records excluded by the adapter where flagged; legacy imports may not expose a demo flag. Validate source origin before enabling the index.

## Proposed architecture — not implemented

```text
Public /search UI and typed search API
        |
Search Gateway (query context, rate limiting, source policy)
        |------------------|-------------------|
MapAble owned index    Exa discovery    Parallel research/fetch
        |------------------|-------------------|
Approved crawl tasks -> robots/terms/allowlist -> extraction -> evidence ledger
        |
Entity resolution (ABN + outlet and deterministic service fit)
        |
Source-labelled cards / verified external link / optional user-approved actions
```

Search providers and crawlers are **separate**:

- Exa: candidate page / website discovery, semantic retrieval, citation material, with contract and budget limits.
- Parallel: source verification and bounded multi-source investigation, with provenance and rate limits.
- Official Commission register: provider registration; separate from NDIA outlet directory.
- Authorised NWSD and State/Territory services only: individual screening status. **Never** send identities, worker IDs or screening information to Exa/Parallel.
- TfNSW open data: advisory route and disruption retrieval; separately verify vehicle-specific access.
- Jobs: only published jobs with explicit employer disclosure permission; no disability or adjustment request disclosed to employers through search.
- Google-oriented crawler projects: research inspiration only, **not** automatic permission to scrape Google results or ignore robots.txt/CAPTCHA/terms. Prefer licensed APIs and publisher-supplied feeds.

## Future typed records

```ts
type SearchDocument = {
  id: string;
  entityKind:
    | "provider_outlet"
    | "care_service"
    | "transport_option"
    | "job"
    | "place";
  sourceKind:
    | "ndia"
    | "ndis_commission"
    | "mapable"
    | "tfnsw"
    | "employer"
    | "web";
  sourceUrl: string;
  sourceRetrievedAt: string;
  sourceEffectiveAt?: string;
  licenseAndReuse?: string;
  verifiedClaims: Array<{
    field: string;
    value: unknown;
    evidenceUrl: string;
    checkedAt: string;
  }>;
  declaredClaims: Array<{
    field: string;
    value: unknown;
    attributedTo: string;
  }>;
  unavailableClaims: string[];
  visibility: "public" | "participant_only" | "authorised_operator_only";
  validUntil?: string;
};
```

Keep entity identification, ABN, site/outlet, location, status and access evidence in separate tables/claims. No all-purpose quality/safety score; unknown is not a positive match. No automatic inference of availability from public opening hours. Do not generate public pages for sensitive people.

## Crawler/agent/security guardrails

- Only crawl publicly permitted URLs on a reviewed host allowlist; implement RFC 9309 robots parsing, noindex/X-Robots-Tag, published ToS, licences and takedown handling. Never bypass CAPTCHA/auth or access restricted records.
- Protect against SSRF and DNS rebinding: resolve and enforce public IP allowlist, HTTPS-only, redirect bounds, DNS checks on every hop, private address rejection, blocked metadata endpoints and timeout/body limits.
- Per-host queues, identifiable user-agent, crawl budgets, backoff, deduplication, immutable source provenance, licence retention and deletion propagation.
- Agents can suggest searches, rechecks or user-facing explanations but cannot submit job applications, book care, disclose disability, assert screening or make payments autonomously.
- Consent is purpose-scoped, revocable, audited; private search history is opt-in and isolated from advertising.
- Ads and commercial placement never influence mandatory access-fit filters, eligibility or safety; any ads clearly labelled and separate from organic results.
- WCAG 2.2 AA, ATAG where authoring provider profiles, keyboard-only, 200% zoom, screen-reader labels, reduced motion, AAC and easy-read test scenarios.
- Synthetic-only tests for abuse, injection, mislabelled demo, false registration, no-match, stale index, revoked consent and cross-tenant leakage.
- Existing process-local IP limit is insufficient for production multi-instance ingress; add distributed rate limiting and abuse controls before turning on public traffic at scale.
- Default-off flags remain off until legal assessment of NDIS digital-platform registration (including 2026 rule changes), copyright and data reuse, security and participant co-design.

## Deployment / integration

The main UI is at `/search` on the existing Next.js 15 application. The marketing sticky header now includes a compact accessibility-first omnibox (`MapAbleHeaderSearchBox`) that navigates to `/search` (Web · Quick) after keyboard testing; it does not call the search API from the header. Existing `/provider-finder`, `/transport`, `/care`, `/employment`, `/ask` and private user routes are unchanged.

Preview environment:

```
MAPABLE_SEARCH_PROVIDER_INDEX_ENABLED=false
```

Do not put Exa/Parallel keys in client environment variables. For later integration use secrets in server-only adapters and explicit egress approval; independently confirm connector licensing and service terms.

## Required validation (not yet executed by this document)

```sh
pnpm exec vitest run tests/mapable-search-discovery.test.ts
pnpm exec tsc --noEmit
pnpm exec next build
```

Also run lint, accessible E2E keyboard/screen reader and relevant security tests in the established repository CI. If base CI is already failing, distinguish existing failures from this PR before promoting. Do not merge or deploy without reviewed evidence.

## Phase gates

1. **Read-only preview:** module navigation and sourced imported outlet search; tests and manual access checks pass.
2. **Permitted ingestion:** licensed Exa/Parallel server adapters, robots/ToS enforcement, source-level evidence ledger and deduplication; test on synthetic and approved public sources.
3. **Cross-domain service graph:** published Jobs, TfNSW advisory transport, Care and provider discovery with cross-domain provenance and participant-controlled preference layers.
4. **Optional actions:** only after independent regulatory/privacy/security review, authorised worker status pathways, informed participant confirmation and operational safeguarding.

**Known blockers:** no verified live Exa or Parallel runtime credentials inside Vercel; no current Commission API integration in this slice; no independent current deployment/CI evidence; no verified public job feed rights; no currently proved all-Australia accessibility truth; no authorised worker NWSD access; no digital-platform registration determination for transaction flows.
