# MapAble durable agent workflows

## Status

**In development.** This slice introduces Vercel Workflow as the durable orchestration layer around the existing canonical MapAble agent registry and OpenAI Agents SDK. It is not a production claim and does not enable autonomous operational actions.

## Boundary

```text
Authenticated MapAble request
        |
        v
POST /api/ai/workflows/mission
        |
        v
Vercel Workflow start()
        |
        v
mapAbleAgentMissionWorkflow          "use workflow"
        |
        v
runMapAbleAgentMissionStep           "use step"
        |
        +--> canonical selectMapAbleAgents()
        |
        +--> OpenAI Agents SDK Mission Orchestrator
        |      model: gpt-6-astra (configurable)
        |      structured advisory output only
        |
        +--> AgentRun + AuditEvent
        |
        v
DurableMissionResult
```

The workflow function only orchestrates. The step owns network/model/database side effects and is independently retryable.

## Safety properties

- Reuses the canonical eight-agent registry; it does not create a second agent registry.
- Agent activation is deterministic before model reasoning.
- The model receives the participant-approved objective, domain labels, and activation summary only in this first slice.
- No participant record retrieval is performed by the workflow.
- No agent tool can book, pay, claim, assign, disclose, diagnose, decide safeguarding, or contact emergency services.
- Human-review and missing-consent results from the deterministic activation plane cannot be removed by model output.
- `MAPABLE_AGENT_WORKFLOW_ENABLED` fails closed unless explicitly set to `true`.
- `MAPABLE_AI_ENABLED=false` or a missing `OPENAI_API_KEY` uses the deterministic fallback.
- Existing non-AI paths remain available.

## Vercel Workflow

The project uses the stable `workflow` package and wraps Next.js with `withWorkflow()`.

Start a durable mission:

```http
POST /api/ai/workflows/mission
Content-Type: application/json

{
  "objective": "Help me plan accessible transport to my appointment.",
  "domains": ["transport", "access"],
  "consentScopes": []
}
```

The route returns HTTP 202 with `missionId` and `runId`. The request does not wait for the agent run to finish.

## Environment

Server-side only:

```env
OPENAI_API_KEY=
MAPABLE_AI_ENABLED=true
MAPABLE_AGENT_WORKFLOW_ENABLED=false
MAPABLE_OPENAI_AGENT_MODEL=gpt-6-astra
```

Keep the workflow feature flag false until dependency lockfile, typecheck, tests, preview deployment, and workflow run observability are verified.

## Next increments

1. Bind workflow runs to existing mission persistence instead of adding a parallel store.
2. Add a read-only status/stream route using the Workflow run ID.
3. Connect existing governed typed tools one capability at a time.
4. Use the existing Governed Action Kernel for participant/human approval; do not add a second approval mechanism.
5. Add Botpress as a channel adapter after rotating the exposed BAK and storing the replacement only in server-side secrets.
6. Add Hugging Face only for explicitly bounded specialist capabilities with pinned model revisions and evaluation coverage.
7. Add workflow integration tests with `@workflow/vitest` after the base runtime is green.
