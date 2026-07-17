/**
 * Prompt-injection boundaries. Any content originating from tool outputs,
 * participant messages, external documents, or MCP responses is UNTRUSTED and
 * must not be able to expand AURA's authority envelope, override its policy,
 * or authorise tool calls on its own.
 *
 * `wrapUntrustedContent` labels a payload for the prompt bundler; the runtime
 * bundler MUST inject explicit boundaries around any wrapped block and MUST
 * strip any "system:" or "policy:" directives inside it.
 */

export interface UntrustedContent {
  source:
    | "participant_message"
    | "tool_output"
    | "external_document"
    | "mcp_response"
    | "a2a_message"
    | "email_or_message_body";
  text: string;
  redactHints?: string[];
}

export interface UntrustedWrapped {
  role: "untrusted";
  source: UntrustedContent["source"];
  text: string;
  boundary: string;
  strippedDirectives: string[];
}

const DIRECTIVE_PATTERNS: RegExp[] = [
  /^\s*system\s*:/gim,
  /^\s*policy\s*:/gim,
  /^\s*aura\s*:/gim,
  /^\s*ignore all previous instructions/gim,
  /^\s*you are now/gim,
  /^\s*from now on/gim,
  /grant\s+authority/gim,
  /release\s+kill\s*switch/gim,
];

export function wrapUntrustedContent(input: UntrustedContent): UntrustedWrapped {
  const stripped: string[] = [];
  let text = input.text;
  for (const pattern of DIRECTIVE_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      stripped.push(...matches);
      text = text.replace(pattern, "[stripped-directive]");
    }
  }
  return {
    role: "untrusted",
    source: input.source,
    text,
    boundary: `<<<UNTRUSTED:${input.source}>>>`,
    strippedDirectives: stripped,
  };
}

export interface AuthorityAttempt {
  action: "grant_authority" | "modify_policy" | "invoke_tool" | "release_hold";
  originSource: UntrustedContent["source"] | "system" | "participant_console";
}

/**
 * Guard used before executing a tool call. Any authority-changing action whose
 * origin is untrusted content is denied.
 */
export function isAuthorityAttemptAllowed(
  attempt: AuthorityAttempt
): { ok: true } | { ok: false; reason: string } {
  const untrusted: AuthorityAttempt["originSource"][] = [
    "tool_output",
    "external_document",
    "mcp_response",
    "a2a_message",
    "email_or_message_body",
  ];
  if (attempt.action === "release_hold") {
    return {
      ok: false,
      reason: "release_hold cannot be initiated by AURA under any circumstance.",
    };
  }
  if (untrusted.includes(attempt.originSource)) {
    return {
      ok: false,
      reason:
        `Untrusted content of source '${attempt.originSource}' cannot authorise action '${attempt.action}'.`,
    };
  }
  return { ok: true };
}
