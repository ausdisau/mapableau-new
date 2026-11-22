# MapAble Companion — Agents SDK + ChatKit evaluation (22 November 2026)

**Status: DRAFT / not deployed.** This is a bounded extension of PR #737
and not a production migration of the existing Ask MapAble API.

## Decision

Keep the existing Next.js/React **Ask MapAble** site widget and
`/api/provider-finder/chat` for public conversational discovery.
Use `@openai/agents` (already in MapAble's root `package.json`) as an
**optional server-side orchestration adapter** after provider source, privacy,
consent and cost gates. Do not add another broad chatbot or agent memory store.

The proposed "MapAble Companion" is Dots-inspired but **not ChatGPT Dots**,
which is a distinct OpenAI product rather than an embeddable software API.

### Official upstream references reviewed

- `https://github.com/openai/openai-agents-js` — TypeScript Agents SDK
  (`Agent`, `Runner`, `tool()`, structured outputs, SDK sessions).
- `https://github.com/openai/openai-chatkit-starter-app` — custom ChatKit
  sample uses React/Vite frontend with **FastAPI/Python** backend; managed
  sample is tied to hosted Agent Builder workflows.
- `https://developers.openai.com/api/docs/guides/chatkit` — ChatKit remains,
  but new projects should use a custom server integration. Agent Builder
  workflows are in a deprecation transition with a scheduled **30 Nov 2026**
  shutdown. **Do not start MapAble on that legacy workflow.**
- `https://developers.openai.com/api/docs/guides/custom-chatkit` —
  documented self-hosted ChatKit server uses the **Python** SDK.
- `https://openai.github.io/openai-agents-js/guides/tools/` —
  TypeScript Zod tool contracts and execution controls.
- `https://openai.github.io/openai-agents-js/guides/running-agents/` —
  max turns, abort signals and tracing controls.
- `https://github.com/openai/openai-agents-js/tree/main/examples/nextjs`
  — Next.js human-approval example with an in-memory demo store.

**Important compatibility finding:** the ChatKit starter's frontend targets
React 19, whereas the currently inspected MapAble root uses React 18 and
Next 15. Do not copy its dependencies, lockfile or full backend into MapAble
without compatibility testing. `@openai/chatkit-react` is a presentation
library, not a ready-made TypeScript implementation of ChatKitServer.
A full self-hosted ChatKit protocol adapter currently requires separate
Python infrastructure or a specifically designed and tested alternative.
The TypeScript-only first phase uses MapAble's existing UI.

## Existing MapAble evidence

- `components/providers.tsx` mounts one `AskMapAbleWidget`.
- Signed-in `app/api/mapable/ask/route.ts` has explicit access gates.
- `components/guided-search/GuidedSearchDialogue.tsx` already supports
  an `@ai-sdk/react` streaming public provider-finder conversation.
- `intelligence/orchestrator.ts` and `intelligence/agents/index.ts`
  already use `@openai/agents` for bounded specialist reasoning.
- `lib/ingestion/ndis-providers-search.ts` has a local snapshot search
  with NO proof of current Commission registration or individual clearance.
- PR #728 proposes source-labelled MapAble Search. Coordinate contracts,
  but do not merge independently without data/source quality checks.

## Implemented in this extension (UNWIRED)

`lib/ask-mapable/agents/public-discovery-contract.ts`:
- single-turn per-request `externalAiApproved: true` input requirement;
- stringent fixed Australian state/postcode and query validation;
- public provider-outlet fields only; removes phone, worker details, marketing,
  ad auction signals and private metadata;
- explicit `unknown` access, availability and worker screening states;
- separate default-off `MAPABLE_PUBLIC_COMPANION_AGENT_ENABLED` and
  `MAPABLE_PUBLIC_COMPANION_DIRECTORY_ENABLED` server flags;
- injectable `SpendReservation` contract for a real ledger to approve
  and reconcile model requests.

`lib/ask-mapable/agents/public-discovery-agent.ts`:
- uses existing TypeScript Agents SDK with Zod parameters;
- allows one fixed, read-only public-directory query per turn;
- query, state and postcode are held by the authoritative server, **not**
  modified by a model's tool arguments;
- structured output and source-ID filtering;
- three-turn and 15-second execution guards;
- disables SDK tracing for this privacy-sensitive early slice;
- no session memory, model file access, public side-effect tools, ad data,
  advertisements, internal provider-priority fields or worker verification;
- **not exposed by an API route** until the budget gate and consent UI exist.

`tests/ask-mapable-public-discovery-contract.test.ts` provides synthetic
tests for consent, feature flags, safe public fields, unknown states and
deduplication. Unit tests cannot establish runtime privacy or model grounding.

## Architecture after separate release gates

```text
Public Access Assistant (existing widget)
  ├── Quick Search (free, public index + provider finder conversation)
  └── Deep Search (explicit credit estimate + participant approval)
                |
      Search and Privacy Policy Gateway
        |  signed-in consent where relevant
        |  identity and rights permissions
        |  pre-dispatch distributed spend reservation
        v
      Node.js @openai/agents manager (flag gated)
        ├── approved source/discovery tool (NDIA + MapAble evidence)
        ├── approved Exa/Parallel research (later, licensed)
        └── evidence reviewer (source IDs and freshness only)
                |
        post-output provenance validation
                |
        answer + cited sources + unknowns
        (ads rendered elsewhere, never in rank or prompt)
```

The upstream Source Provider Finder skill requires:
1. Official NDIS provider record for registration-related facts, not inferred
   from MapAble's imported or declared record;
2. Provider vs individual worker separation; no worker-screening inference;
3. Hard functional requirements AND, not softened into convenience rankings;
4. Evidence status and freshness, with no fabricated availability;
5. Provider recommendations must never be improved by ad spend or commercial
   placement. Unknown is not verified.

## Relationship to AdvoEqual financial assessment

The privately supplied `AdvoEqual_Financial_and_Strategic_Assessment_2026-11-21.md`
concludes that reusing existing code and testing a narrowly scoped
user-benefit hypothesis is more defensible than opening a costly, full-scale
AI case-management product before operations and unrestricted cash are
verified. The supplied follow-on cost study separates low token charges
from substantial engineering, privacy, accessibility, maintenance and
professional-review costs.

These reports concern **AdvoEqual**, not an approved MapAble budget. Do not
copy private Xero/Stripe balances, legal case details or bank information
into the Companion prompts, source corpus, trace logs or marketing.
Do not adopt AdvoEqual's pilot cap as MapAble spending authority.
MapAble needs its own cost center, owner, period, budget cap, alert thresholds
and documented account/consent rules before an external-model pilot.

## Blockers before connecting the SDK to the widget

1. **Privacy and user consent:** specific pre-dispatch notice that the prompt
   goes to an external AI provider, and a non-AI equivalent route;
   avoid personal health, case-file or NDIS identifiers in public search.
2. **Enforceable cost ledger:** server-side distributed reservation, idempotent
   settlement, provider-reported tokens, USD/AUD currency basis, tool charges,
   daily/user/month caps, 429 behavior and admin kill switch.
   `maxTurns` and `maxUsdMicros` **in an unverified object are not spending
   controls**. No current production-ready cost ledger is claimed.
3. **Source integrity:** verify imported NDIS snapshot origin, refresh,
   registration facts, demo exclusions and public-use licence before enabling
   directory lookup; source URLs and current status are separate fields.
4. **Model evaluation:** prevent hallucinated clearance, availability,
   NDIS funding, access verification and advertiser preference; test prompt
   injection and non-English/AAC communication. The present structured
   summary is NOT independently claim-validated; keep the output unwired.
5. **Tracing and data retention:** disabling SDK tracing does not prevent
   processing or retention by the external model provider. Confirm provider
   agreements, location/retention and necessary consents.
6. **Accessible UI:** co-design across disability/communication styles;
   WCAG 2.2 AA, keyboard/switch, screen reader, 320px and 200% zoom,
   reduced motion, plain-language and error recovery.
7. **NDIS obligations:** recheck the digital platform registration rules
   before paid worker matching, casework, regulated transactions or worker
   checks; no automatic booking or employment disclosure.
8. **ChatKit option:** evaluate the maintained custom-server Python path and
   React version implications separately; do not use retiring Agent Builder.
9. **Production controls:** process-local rate limits are insufficient
   for multi-instance public access. Evaluate distributed limits and abuse
   protection before enabling `NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED`.

## Flags and no-op defaults

```env
NEXT_PUBLIC_MAPABLE_PUBLIC_ACCESS_ASSISTANT_ENABLED=false
NEXT_PUBLIC_ASK_MAPABLE_EMBEDDED_ENABLED=false
MAPABLE_PUBLIC_COMPANION_AGENT_ENABLED=false
MAPABLE_PUBLIC_COMPANION_DIRECTORY_ENABLED=false
# MAPABLE_PUBLIC_COMPANION_MODEL=approved-server-model-id
# OPENAI_API_KEY=store-in-secret-manager-only
```

The optional Agents SDK adapter has no publicly reachable route.
**There is no live ChatKit session, token charging, saved Dot tasks, paid ads
influence, payment, worker-screening or background monitoring created here.**

## Test and deployment gate

```sh
pnpm exec vitest run tests/ask-mapable-public-guest.test.tsx tests/ask-mapable-public-discovery-contract.test.ts tests/ask-mapable-widget.test.tsx
pnpm exec tsc --noEmit
pnpm exec next build
```

Observe GitHub PR CI and the specific Vercel preview generated from the
exact PR head SHA. Do not merge, flip production flags or deploy to
`mapable.com.au` without approved privacy, source, model spend,
accessibility and security tests.
