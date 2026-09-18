# OpenAI Agents API curl runner

This is a small, dependency-light harness for the current OpenAI **Agents API**. It creates a reusable agent, starts a managed session from the returned agent ID, sends an initial user message, and streams session events with `curl`.

## Runtime

Use Bash 4+, `curl`, and `jq`. The current agent has no tools that need code execution, so the session uses the supported `{"type":"none"}` environment and does not provision a sandbox/executor. The runner still handles `agent.session.requires_action` fail-closed: any unregistered function call receives a failed tool result instead of being executed.

## Credentials and project

The runner reads the secret only from `OPENAI_API_KEY`. It sends the project header for:

`proj_aRYSx2ldlGChWX1AGcPdwfv0`

You may override it with `OPENAI_PROJECT_ID`. Never commit an API key.

```bash
export OPENAI_API_KEY="your-project-api-key"
export OPENAI_PROJECT_ID="proj_aRYSx2ldlGChWX1AGcPdwfv0"
```

The API key must be authorized for that OpenAI project and for the Agents API/model being used.

## Run

From the repository root:

```bash
chmod +x scripts/openai-agents-api/run.sh
scripts/openai-agents-api/run.sh
```

Or supply the first user message:

```bash
scripts/openai-agents-api/run.sh "Summarize your role in MapAble in three sentences."
```

The script:

1. `POST /v1/agents` using `agent.json`.
2. Extracts the reusable `agent_id`.
3. `POST /v1/agents/sessions` with that `agent_id`, an initial message, and `environment.type=none`.
4. `GET /v1/agents/sessions/{session_id}/events` with SSE streaming.
5. Prints output deltas and event types.
6. If a function action is unexpectedly requested, posts a fail-closed `agent.session.input.tool_result` to `POST /v1/agents/sessions/{session_id}/events`.
7. Prints a curl command for inspecting the final session items.

## Agent configuration

`agent.json` preserves the requested name, `gpt-6-astra`, medium reasoning, automatic reasoning summary, text output, and medium verbosity. The previously empty instructions field is completed with a narrow MapAble development role that emphasizes accessibility, evidence, participant autonomy, privacy, consent, and human review.

No tools are enabled yet. When adding a function tool, add an explicit allowlisted implementation to `submit_tool_result`; do not turn arbitrary model-provided commands into shell execution.

## Troubleshooting

- **401**: check `OPENAI_API_KEY`.
- **403 / project error**: confirm the key belongs to or can access the configured project.
- **model access error**: confirm `gpt-6-astra` is enabled for the project; keep the configured model unchanged unless intentionally migrating.
- **missing jq/curl**: install those command-line utilities.
- **stream disconnect**: rerun the events GET for the same session ID; the API exposes session event streaming separately from session creation.
