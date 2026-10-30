# Applying the eight-part chatbot tutorial to MapAble

Reviewed: 30 October 2026. Draft work: PR #628, stacked on #627.

| Part | Technique | Decision |
|---|---|---|
| 1 | Python LangGraph and Streamlit UI | Reuse the flow, not the frameworks. Keep Next.js, React, server-only retrieval and progressive results. |
| 2 | Short-term message memory | Use bounded typed search context in React for follow-ups; no raw history sent to an LLM. |
| 3 | Redis state | Skip another datastore; temporary context is in the browser and durable opted-in preferences use existing Neon. |
| 4 | Time to live | Clear chat and expire browser context after 30 minutes inactive. |
| 5 | MongoDB conversation persistence | Do not store raw history; require separate explicit retention consent before offering durable history in Neon. |
| 6 | Authentication | Keep existing MapAble NextAuth; do not copy the tutorial's illustrative password database. |
| 7 | Keycloak | Do not add another identity service. Identity is already connected; Part 7's page was inaccessible, so only the linked article description and Part 8 were available. |
| 8 | User-scoped conversation history | Scope all profile access to the logged-in user. Do not expose old conversations without separate consent. |

Sources: Ratnesh Yadav, Medium 2025, parts 1-8. Part 8 states it concludes the basic chatbot series. Reference URLs are maintained in the product decision record and original user request.

## Applied in code

- Authenticated API with Origin guard and bounded per-user request rate limit.
- Parameterised queries against imported provider service and registration-group names in Neon.
- Privacy-scoped profile requires explicit per-search consent before use.
- Stateless, validated prior-search context holds only geography, service filters and pagination offsets.
- Browser can ask follow-up questions or Show more; the context expires after 30 minutes inactivity.
- No stored transcript, diagnoses, precise location or worker-screening data.
- Stream response reports unknown availability/access/funding status rather than inventing matches.
- Provider map uses chat pins even when empty, rather than showing unrelated directory entries.

Do not merge until authentication, CI, WCAG 2.2 AA, privacy and regulatory checks are completed. No Python, Streamlit, Redis, MongoDB, Keycloak or LangGraph runtime is necessary for this vertical slice.
