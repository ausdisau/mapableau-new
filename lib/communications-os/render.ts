import {
  CONNECTED_CAPABILITY_SOURCE_VERSION,
  type CommunicationRenderingRequest,
  type CommunicationRenderingResponse,
} from "@/lib/connected-capability";

import type { CommunicationPassportProjection } from "./types";

/**
 * Meaning-preservation renderer — structured presentation contract.
 * Does not send external messages.
 */
export function renderCommunicationPassport(
  passport: CommunicationPassportProjection,
  request: Omit<CommunicationRenderingRequest, "passportId" | "participantId">
): CommunicationRenderingResponse {
  const fullRequest: CommunicationRenderingRequest = {
    ...request,
    passportId: passport.id,
    participantId: passport.participantId,
  };

  const oneQuestion = passport.requirements.some(
    (r) => r.kind === "one_question_at_a_time" && r.value === true
  );
  const responseTimeReq = passport.requirements.find(
    (r) => r.kind === "response_time"
  );
  const responseTimeMinimumSeconds =
    typeof responseTimeReq?.value === "number" ? responseTimeReq.value : null;

  const blocks: CommunicationRenderingResponse["blocks"] = [];

  if (request.presentation === "easy_read") {
    blocks.push({
      type: "heading",
      text: "How to communicate with me",
    });
    for (const instruction of passport.participantAuthoredInstructions) {
      blocks.push({ type: "instruction", text: instruction, pauseMs: 800 });
    }
    for (const req of passport.requirements) {
      blocks.push({
        type: "list",
        text: formatRequirementEasyRead(req.kind, req.value, req.instructions),
      });
    }
    blocks.push({
      type: "warning",
      text: "Communication support does not mean I cannot make my own decisions.",
    });
  } else if (request.presentation === "one_question") {
    blocks.push({
      type: "heading",
      text: "One question at a time",
    });
    blocks.push({
      type: "instruction",
      text:
        passport.participantAuthoredInstructions[0] ??
        "Please ask only one question, then wait.",
      pauseMs: (responseTimeMinimumSeconds ?? 5) * 1000,
    });
  } else {
    blocks.push({
      type: "heading",
      text: "Communication Passport",
    });
    if (passport.participantAuthoredInstructions.length) {
      blocks.push({
        type: "paragraph",
        text: passport.participantAuthoredInstructions.join(" "),
      });
    }
    for (const req of passport.requirements) {
      blocks.push({
        type: "list",
        text:
          req.instructions ??
          `${req.kind}: ${String(req.value)}`,
      });
    }
    blocks.push({
      type: "paragraph",
      text: "Silence or delay is not consent. Do not infer needs from diagnosis.",
    });
  }

  return {
    request: fullRequest,
    blocks,
    oneQuestionAtATime: oneQuestion,
    responseTimeMinimumSeconds,
    sourceVersion: CONNECTED_CAPABILITY_SOURCE_VERSION,
    isSynthetic: passport.isSynthetic,
  };
}

function formatRequirementEasyRead(
  kind: string,
  value: string | boolean | number,
  instructions?: string
): string {
  if (instructions) return instructions;
  switch (kind) {
    case "plain_language":
      return "Use plain language.";
    case "aac_method":
      return "I use AAC. Give me time to reply.";
    case "one_question_at_a_time":
      return "Ask one question at a time.";
    case "response_time":
      return `Wait at least ${value} seconds.`;
    case "interpreter":
      return "I may need an interpreter.";
    default:
      return `${kind}: ${String(value)}`;
  }
}
