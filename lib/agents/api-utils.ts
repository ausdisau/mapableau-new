import { AgentError } from "./agent-errors";

export function agentErrorResponse(error: unknown): Response {
  if (error instanceof AgentError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  const message =
    error instanceof Error ? error.message : "Agent request failed.";
  return Response.json({ error: message, code: "AGENT_ERROR" }, { status: 500 });
}
