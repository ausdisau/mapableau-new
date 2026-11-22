# MapAble Search — Neon + Supabase public discovery query

**Status (22 November 2026): draft; default-OFF; not deployed.**

## Technical decision

The user's requested `GraphGL` is a graph-visualisation library, while
`GraphQL` is the query language. Both can play a role:

- **GraphQL**: a fixed, explicit `MapAbleDirectory` read-only query shape;
- **jQuery**: optional legacy AJAX client; keep the Next.js/React interface
  canonical rather than loading jQuery everywhere;
- **GraphGL / graph.gl**: optional network diagram of *public* providers,
  provenance sources and broad state associations; **not** a user/account
  relationship graph. Always offer an equivalent accessible text/list view.

Official references:
- https://graphql.org/learn/serving-over-http/
- https://www.graphql-js.org/docs/
- https://graph.gl/gatsby/docs/api-reference/graphgl/
- https://supabase.com/docs/guides/graphql/api
- https://neon.com/docs/extensions/pg_graphql

## Directly inspected evidence

| Project | Evidence | State and limitations |
| --- | --- | --- |
| Neon `MabAble` (`square-grass-31199936`) | Branch `br-rapid-cake-a77uqpjx`, `public."Provider"`, `public."ServiceLocation"` schema; `SELECT COUNT(*)` returned **2 rows** | Branch metadata says `archived` but read-only SQL succeeded. Confirm Vercel's `DATABASE_URL` points to this intended project; do not infer current registration or live availability from columns |
| Supabase `MapAble` (`louioyirfyzdjshmremy`) | Project API returned `INACTIVE`; table metadata query failed | No live schema, RLS or migration verification; **keep source flag OFF**. Do not restore, spend or modify project without explicit approval |
| GitHub `ausdisau/mapableau-new` | Prisma `Provider` + `ServiceLocation` models; `lib/prisma.ts`; Supabase import script and `supabase/migrations/20260604120000_provider_outlets.sql` | Repository schema and migration are design evidence, not proof of deployed production state |

The checked-in Supabase migration proposes RLS on `provider_outlets`
and a SELECT policy limited to `active=true`. **Active in an imported
record does not independently verify live NDIS Commission registration,
worker clearance, access fit, suitability, provider availability or quality.**

## Code added to draft PR #737

1. `lib/mapable-search/federated-public-directory.ts` — exact
   allowlisted, GraphQL-shaped operation; Zod validation; stable alphabetical
   sorting independent of advertising; source states; public-only graph nodes.
2. `lib/mapable-search/public-provider-sources.server.ts` —
   existing Prisma client reads named providers and first locality only;
   optional Supabase **RLS-scoped publishable/anon-key** client reads
   `id,name,state,postcode` from `provider_outlets`.
   The existing `getSupabaseAdmin()` service-role client is **never used**.
3. `app/api/mapable/search/graphql/route.ts` — POST-only, read-only,
   Node.js endpoint. Disabled by default. Rejects every query other than the
   stored `MapAbleDirectory` operation; never accepts arbitrary SQL,
   mutations, GraphQL introspection or a path to private tables.
4. `examples/mapable-search/jquery-federated-query.js` — optional
   client sample using `$.ajax` and jQuery's safe `.text()` DOM output;
   reports source status and has an accessible list fallback.
5. `tests/mapable-search-federated-graphql.test.ts` — synthetic contract
   tests for schema, source unavailability, no private fields, unknown status
   preservation, advertiser independence and graph connections.

**Important precision:** this is a **fixed persisted GraphQL-shaped
operation**, not a general GraphQL standards-compliant execution engine.
It returns the standard `{data, errors}` response envelope and accepts
an exact GraphQL document. Do not advertise open GraphQL introspection,
arbitrary field selection, batching, mutations or GraphiQL compatibility.
A full GraphQL gateway (e.g. GraphQL.js with audited resolvers) is
deferred until a consumer needs it.

## Example approved GraphQL document

```graphql
query MapAbleDirectory($text: String!, $state: String, $limit: Int!) {
  mapAbleDirectory(text: $text, state: $state, limit: $limit) {
    providers {
      id
      name
      state
      locality
      source
      evidenceStatus
      registrationStatus
      availability
    }
    graph {
      nodes { id label kind }
      edges { sourceId targetId kind }
    }
    sources { neon supabase }
  }
}
```

Example variables:

```json
{
  "text": "support",
  "state": "NSW",
  "limit": 10
}
```

Send JSON `{ "operationName": "MapAbleDirectory", "query": "<exact document above>", "variables": {...} }`
to `POST /api/mapable/search/graphql`. The example jQuery script
includes the identical canonical query literal to prevent document drift.

Successful response shape (synthetic example, NOT observed results):

```json
{
  "data": {
    "mapAbleDirectory": {
      "providers": [{
        "id": "synthetic-1",
        "name": "Synthetic Example Provider",
        "state": "NSW",
        "locality": "Sydney",
        "source": "neon",
        "evidenceStatus": "imported_or_self_described",
        "registrationStatus": "not_currently_verified",
        "availability": "unknown"
      }],
      "graph": {
        "nodes": [
          {"id":"source:neon","label":"MapAble Neon","kind":"source"},
          {"id":"provider:neon:synthetic-1","label":"Synthetic Example Provider","kind":"provider"},
          {"id":"state:NSW","label":"NSW","kind":"state"}
        ],
        "edges": [
          {"sourceId":"source:neon","targetId":"provider:neon:synthetic-1","kind":"source_record"},
          {"sourceId":"provider:neon:synthetic-1","targetId":"state:NSW","kind":"listed_in_state"}
        ]
      },
      "sources": {"neon":"ok","supabase":"disabled"}
    }
  }
}
```

## jQuery host markup (example only, not mounted on the live website)

The JavaScript file assumes the host already loads a reviewed local jQuery
asset; it does NOT install it or load an uncontrolled external CDN.

```html
<form id="mapable-directory-form">
  <label for="mapable-directory-query">Search public provider names</label>
  <input id="mapable-directory-query" name="query" minlength="2"
         maxlength="80" required autocomplete="off">
  <label for="mapable-directory-state">State (optional)</label>
  <select id="mapable-directory-state" name="state">
    <option value="">All states</option>
    <option value="NSW">New South Wales</option>
    <option value="VIC">Victoria</option>
    <option value="QLD">Queensland</option>
    <option value="SA">South Australia</option>
    <option value="WA">Western Australia</option>
    <option value="TAS">Tasmania</option>
    <option value="ACT">ACT</option>
    <option value="NT">Northern Territory</option>
  </select>
  <button type="submit">Search providers</button>
</form>
<p id="mapable-directory-status" role="status" aria-live="polite"></p>
<div id="mapable-directory-results"></div>
<!-- Load an approved jQuery asset first, then
     /examples/mapable-search/jquery-federated-query.js as appropriate. -->
```

## Optional graph.gl renderer — isolated research example

Do **not** add `graph.gl` to MapAble production dependencies yet. Check
upstream maintenance and React 18 compatibility, CSP, performance, accessible
keyboard alternatives and security first. The API emits a graph.gl-friendly
node/edge shape regardless of renderer choice.

```tsx
// Illustrative adapter for a separate graph.gl prototype (not yet wired).
import GraphGL, { JSONLoader, D3ForceLayout, NODE_TYPE } from "graph.gl";

type PublicNetwork = {
  nodes: { id: string; label: string; kind: string }[];
  edges: { sourceId: string; targetId: string; kind: string }[];
};

export function MapAblePublicGraph({ network }: { network: PublicNetwork }) {
  const graph = JSONLoader({
    json: {
      nodes: network.nodes,
      edges: network.edges.map((e, index) => ({ ...e, id: String(index) })),
    },
    nodeParser: (node) => ({ id: node.id }),
    edgeParser: (edge) => ({
      id: edge.id,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      directed: true,
    }),
  });

  return (
    <>
      <GraphGL graph={graph} layout={new D3ForceLayout()}
        nodeStyle={[{ type: NODE_TYPE.CIRCLE, radius: 9, fill: "#005B7F" }]}
        edgeStyle={{ stroke: "#82949A", strokeWidth: 1 }} />
      <ul aria-label="Accessible graph relationships">
        {network.edges.map((edge, index) => (
          <li key={index}>{edge.sourceId} connects to {edge.targetId}:
            {edge.kind.replaceAll("_", " ")}</li>
        ))}
      </ul>
    </>
  );
}
```

Do not infer a provider–worker, provider–participant, clinical, employment
or transport booking relationship from this graph. Edges only indicate
that a record was sourced from a named database and associated with a
broad Australian State/Territory field.

## Required release gates

- [ ] Validate exact database ownership, connections and configured regions.
- [ ] Confirm Supabase project restored only with explicit user approval;
      confirm table, RLS `anon` SELECT, grants, project status and advisors.
- [ ] Approve public use of the provider records, licensing, correction/
      removal workflows, consent and provenance labels.
- [ ] Use separate read-only Neon database credentials for this endpoint;
      never expose Prisma or Supabase secrets in browser.
- [ ] Implement verified **distributed** rate limiting and shared abuse
      protection, not just the existing process-local IP limiter.
- [ ] Verify network and timeout behavior; rate/cost limits and per-source
      index plans for case-insensitive substring search at scale.
- [ ] WCAG 2.2 AA, 320px reflow, keyboard/switch/AAC/screen-reader tests;
      no graph-only interpretation or color-only statuses.
- [ ] Check no advertiser signals can affect organic ranking, shortlists,
      model prompts, source prominence or graph placement.
- [ ] Confirm AU data residency requirements before cross-region integration:
      inspected Supabase project is in `us-east-1`, Neon in
      `aws-ap-southeast-2`.
- [ ] Run focused tests plus mandatory CI, Quality, Security, CSP, CodeQL
      and Accessibility workflows. The draft PR's previous baseline build
      blockers are not permission to waive checks.

### Flags — all OFF by default

```env
MAPABLE_FEDERATED_DIRECTORY_ENABLED=false
MAPABLE_FEDERATED_DIRECTORY_NEON_ENABLED=false
MAPABLE_FEDERATED_DIRECTORY_SUPABASE_ENABLED=false
# Existing DATABASE_URL + DIRECT_URL are server-side Prisma only.
# SUPABASE_URL=...                 # server-only, after source verification
# SUPABASE_PUBLISHABLE_KEY=...     # RLS-scoped, not service_role
```

Do not merge or deploy to `mapable.com.au` until all privacy, source,
accessibility, security, cost and CI checks pass.
