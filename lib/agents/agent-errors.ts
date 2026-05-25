export class AgentError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "AgentError";
  }
}

export class AgentDisabledError extends AgentError {
  constructor() {
    super("AGENTS_DISABLED", "MapAble agents are not enabled.", 503);
  }
}

export class AgentPermissionError extends AgentError {
  constructor(message = "You do not have permission for this agent action.") {
    super("AGENT_FORBIDDEN", message, 403);
  }
}

export class AgentConsentError extends AgentError {
  constructor(message = "Required consent is not granted.") {
    super("AGENT_CONSENT_REQUIRED", message, 403);
  }
}

export class AgentSafetyError extends AgentError {
  constructor(message: string) {
    super("AGENT_SAFETY_BLOCKED", message, 403);
  }
}

export class AgentModelUnavailableError extends AgentError {
  constructor() {
    super(
      "AGENT_MODEL_UNAVAILABLE",
      "The configured model provider is unavailable.",
      503
    );
  }
}
