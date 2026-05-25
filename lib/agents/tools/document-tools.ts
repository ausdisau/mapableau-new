import { tool } from "@strands-agents/sdk";
import { z } from "zod";

import { checkConsent } from "@/lib/consent/consent-service";
import type { ConsentScope } from "@/types/mapable";

import { getMapableState } from "./tool-context";
import { toToolJson } from "./to-tool-json";

export const searchConsentedDocuments = tool({
  name: "search_consented_documents",
  description: "Search documents the user may access under active consent scopes.",
  inputSchema: z.object({
    query: z.string().min(2),
    purpose: z.string().min(3),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    const participantId = state.context.participantId ?? state.context.userId;
    const ok = await checkConsent({
      subjectUserId: participantId,
      scope: "documents.read" as ConsentScope,
      grantedToUserId: state.context.userId,
    });
    if (!ok && state.context.role !== "mapable_admin") {
      return toToolJson({
        ok: false,
        error: "I need consent before I can access documents.",
      });
    }
    state.toolCalls.push({
      toolName: "search_consented_documents",
      status: "completed",
      riskLevel: "medium",
    });
    return toToolJson({
      ok: true,
      matches: [],
      query: input.query,
      note: "Document titles only; full content requires opening Documents.",
    });
  },
});

export const summariseDocumentForRole = tool({
  name: "summarise_document_for_role",
  description: "Summarise a document for the current role (redacted).",
  inputSchema: z.object({
    documentId: z.string().min(1),
    purpose: z.string(),
  }),
  callback: async (input) => ({
    documentId: input.documentId,
    summary: "Document summary prepared for review. Full file not attached in chat.",
    status: "draft_only",
  }),
});

export const addDocumentToEvidencePackDraft = tool({
  name: "add_document_to_evidence_pack_draft",
  description: "Add a document reference to an evidence pack draft.",
  inputSchema: z.object({
    documentId: z.string().min(1),
    evidencePackDraftId: z.string().min(1),
  }),
  callback: async (input, context) => {
    const state = getMapableState(context);
    state.actionStatus = "requires_human_review";
    return {
      status: "draft_only",
      documentId: input.documentId,
      evidencePackDraftId: input.evidencePackDraftId,
    };
  },
});
