# Access Intelligence — AI Agent

## Stack

- Package: `ai@6`, `@ai-sdk/react`, `@ai-sdk/google`
- Agent: `ToolLoopAgent` + `Output.object({ schema: agentAccessPlanSchema })`
- Chat: `createAgentUIStreamResponse` + client `useChat` / `DefaultChatTransport`
- Approvals: `needsApproval: true` + `addToolApprovalResponse`

## Tools

| Tool | Mode |
|------|------|
| loadAccessPassport | read |
| searchPlaces | read |
| readAccessGraph | read |
| getLiveAccessStatus | read (demo mock feed) |
| calculatePersonalFit | read → deterministic engine |
| buildAccessibleRoute | read → deterministic engine |
| createVisitPlan | local persist |
| requestVenueVerification | write + approval |
| submitBarrierReport | write + approval |
| shareAccessPassport | write + approval |

## Rules enforced in instructions

Never claim accessibility without evidence; never infer from diagnosis; treat missing as unknown; separate source types; blockers first; no legal compliance claims; approval before external writes.

## Model configuration

`ACCESS_INTELLIGENCE_MODEL` / `AI_MODEL` / `SEARCH_INTERPRETER_MODEL` with `AI_GATEWAY_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY`.

Chat returns 503 with recovery hint when keys are absent; passport, explore, engines, and Venue Studio still work.
