import type {
  RelationalDenialCode,
  RelationalDenialState,
} from "@/lib/ai/relational/types";

const DENIAL_COPY: Record<
  RelationalDenialCode,
  Omit<RelationalDenialState, "code">
> = {
  capability_not_registered: {
    title: "This action is not available",
    message:
      "MapAble cannot run that request because it is not a registered capability.",
    nextStep:
      "Try a supported interpret, clarify, or explain request, or ask for human help.",
  },
  feature_flag_disabled: {
    title: "Relational Intelligence is turned off",
    message: "This capability is disabled by configuration.",
    nextStep:
      "Continue without this suggestion, or ask an administrator if it should be enabled.",
  },
  global_kill_switch: {
    title: "Temporarily unavailable",
    message: "AI features are paused by a platform safety kill switch.",
    nextStep: "Try again later, or contact support if this blocks urgent help.",
  },
  relational_kill_switch: {
    title: "Temporarily unavailable",
    message: "Relational Intelligence is paused by a safety kill switch.",
    nextStep: "Try again later, or contact support if this blocks urgent help.",
  },
  capability_kill_switch: {
    title: "Temporarily unavailable",
    message: "This specific capability is paused by a safety kill switch.",
    nextStep: "Try again later, or ask for human help.",
  },
  authority_exceeded: {
    title: "That action is not allowed",
    message:
      "The request asked for more authority than this capability may use.",
    nextStep:
      "Use a read-only or draft request instead, or ask a person to review.",
  },
  tool_not_allowlisted: {
    title: "Tool not permitted",
    message: "A requested tool is outside this capability’s allowlist.",
    nextStep: "Retry without restricted tools, or ask for human help.",
  },
  tenant_mismatch: {
    title: "Organisation mismatch",
    message: "This request does not match your organisation context.",
    nextStep: "Refresh and try again in the correct organisation.",
  },
  participant_mismatch: {
    title: "Participant mismatch",
    message: "This request does not match the intended participant.",
    nextStep:
      "Confirm you are helping the correct person, or ask for human help.",
  },
  consent_missing_or_wrong_purpose: {
    title: "Consent required",
    message: "Valid consent for this purpose is missing.",
    nextStep:
      "Review consent settings for this purpose, or ask for human help.",
  },
  model_authority_rejected: {
    title: "Unsafe authority claim rejected",
    message: "Authority or tool claims from a model or client were ignored.",
    nextStep: "Retry with a normal request, or ask for human help.",
  },
  prohibited_operational_capability: {
    title: "Not permitted",
    message:
      "That operational action is permanently blocked for Relational Intelligence.",
    nextStep: "Ask a staff member for Care, Transport, or Jobs support.",
  },
  prohibited_inference: {
    title: "Not permitted",
    message: "That inference is permanently prohibited.",
    nextStep: "Ask for human help if you need support with this situation.",
  },
  envelope_invalid: {
    title: "Invalid request",
    message: "The governed action envelope was incomplete or invalid.",
    nextStep: "Retry the request, or ask for human help if it keeps failing.",
  },
  not_relational_capability: {
    title: "Not a relational capability",
    message: "This gate only covers Relational Intelligence capabilities.",
    nextStep: "Use the correct governed pathway for that capability.",
  },
};

export function buildRelationalDenialState(
  code: RelationalDenialCode,
): RelationalDenialState {
  return { code, ...DENIAL_COPY[code] };
}
