import { createHash } from "node:crypto";

import { pbsConfig } from "@/lib/config/positive-behaviour-support";

import { assertAssistanceActionAllowed } from "./invariants";
import { unansweredSections } from "./questionnaire";
import type {
  PbsAssistanceRequest,
  PbsAssistanceResult,
  PbsQuestionnaireSection,
} from "./types";
import { PBS_QUESTIONNAIRE_SECTIONS } from "./types";

export interface PbsAssistanceEngine {
  run(request: PbsAssistanceRequest): Promise<PbsAssistanceResult>;
}

function hashPayload(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

/**
 * Default engine: deterministic, local, rules/template based, auditable.
 * No external model call. Authority ceiling DRAFT_ONLY.
 */
export class DeterministicPbsAssistanceEngine implements PbsAssistanceEngine {
  readonly engineId = "pbs-deterministic-rules-v1";
  readonly promptVersion = "pbs-assist-prompts-v1";

  async run(request: PbsAssistanceRequest): Promise<PbsAssistanceResult> {
    if (!pbsConfig.enabled || !pbsConfig.aiAssistanceEnabled) {
      throw new Error("PBS AI assistance is disabled");
    }
    assertAssistanceActionAllowed(request.action);

    const proposals: PbsAssistanceResult["proposals"] = [];
    const unknowns: string[] = [];
    const conflicts: string[] = [];

    switch (request.action) {
      case "identify_unanswered_sections": {
        const answered = (request.knownSectionKeys ??
          []) as PbsQuestionnaireSection[];
        const missing =
          request.unansweredSectionKeys?.length
            ? request.unansweredSectionKeys
            : unansweredSections(answered);
        for (const section of missing) {
          proposals.push({
            kind: "unanswered_section",
            text: `Section still unanswered: ${section}. Unknown remains unknown until the participant or informant provides information.`,
            sectionKey: section,
          });
          unknowns.push(section);
        }
        break;
      }
      case "draft_neutral_follow_up_questions": {
        const sections =
          request.sectionKeys ??
          (request.unansweredSectionKeys as string[] | undefined) ??
          [...PBS_QUESTIONNAIRE_SECTIONS];
        for (const section of sections) {
          proposals.push({
            kind: "follow_up_question",
            sectionKey: section,
            text: `Could you share more about ${section.replace(/_/g, " ")}? You may skip or say you do not know.`,
          });
        }
        break;
      }
      case "organise_approved_evidence": {
        for (const key of request.approvedEvidenceKeys ?? []) {
          proposals.push({
            kind: "evidence_organisation",
            text: `Practitioner-approved evidence item organised under key ${key}.`,
          });
        }
        break;
      }
      case "prepare_consultation_checklist": {
        proposals.push({
          kind: "consultation_checklist",
          text: "Confirm participant preferences, informants consulted, accessible formats used, and unresolved disagreements recorded.",
        });
        proposals.push({
          kind: "consultation_checklist",
          text: "If restrictive practices may be involved, escalate to the restrictive-practice gate (human-only).",
        });
        break;
      }
      case "create_plain_language_summary": {
        proposals.push({
          kind: "plain_language_summary",
          text: "Draft summary scaffold: strengths, preferences, observed patterns (not causes), preferred supports, and open questions. Practitioner must review.",
        });
        break;
      }
      case "prepare_draft_section_scaffolding": {
        for (const section of request.sectionKeys ?? ["good_life"]) {
          proposals.push({
            kind: "section_scaffold",
            sectionKey: section,
            text: `Draft scaffold for ${section}: [participant voice] [known facts] [unknowns] [disagreements]. Not a clinical determination.`,
          });
        }
        break;
      }
      case "identify_contradictions": {
        for (const c of request.contradictions ?? []) {
          proposals.push({
            kind: "contradiction",
            text: `Unresolved contradiction between ${c.left} and ${c.right}: ${c.label}`,
            unresolved: true,
          });
          conflicts.push(c.label);
        }
        if ((request.contradictions ?? []).length === 0) {
          proposals.push({
            kind: "contradiction",
            text: "No contradictions supplied for review.",
          });
        }
        break;
      }
      case "map_reviewed_content_to_template": {
        proposals.push({
          kind: "template_mapping",
          text: "Reviewed content mapped to interim/comprehensive plan template sections as candidates only. Human acceptance required before any plan write.",
        });
        break;
      }
      default: {
        const _exhaustive: never = request.action;
        throw new Error(`Unhandled assistance action: ${_exhaustive}`);
      }
    }

    const inputHash = hashPayload(request);
    const outputBody = { proposals, unknowns, conflicts };
    const outputHash = hashPayload(outputBody);

    return {
      authorityCeiling: pbsConfig.authorityCeiling,
      engineId: this.engineId,
      action: request.action,
      proposals,
      unknowns,
      conflicts,
      provider: "deterministic_local",
      model: "rules-v1",
      promptVersion: this.promptVersion,
      inputHash,
      outputHash,
      externalModelUsed: false,
    };
  }
}

export const defaultPbsAssistanceEngine: PbsAssistanceEngine =
  new DeterministicPbsAssistanceEngine();
