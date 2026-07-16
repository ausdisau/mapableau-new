import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type AssistanceRole =
  | "venue_receptionist"
  | "transport_coordinator"
  | "support_worker"
  | "trusted_supporter"
  | "mapper"
  | "accessibility_officer"
  | "remote_visual_assistance"
  | "mapable_support"
  | "interpreter";

export type HumanAssistanceRequest = {
  id: string;
  userId: string;
  missionId?: string;
  role: AssistanceRole;
  recipientLabel: string;
  purpose: string;
  fieldsShared: string[];
  fieldsOmitted: string[];
  expectedResponse: string;
  queueState: "pending_approval" | "queued" | "assigned" | "acknowledged" | "closed" | "expired";
  fallback: string;
  expiresAt: string;
  participantApproved: boolean;
  diagnosisDisclosed: false;
  createdAt: string;
};

export type HumanAssistanceReceipt = {
  id: string;
  requestId: string;
  event: string;
  at: string;
};

const requests = new Map<string, HumanAssistanceRequest>();
const receipts = new Map<string, HumanAssistanceReceipt[]>();

export function resetHumanAssistanceStore(): void {
  requests.clear();
  receipts.clear();
}

export function draftHumanAssistance(input: {
  userId: string;
  missionId?: string;
  role: AssistanceRole;
  recipientLabel: string;
  purpose: string;
  fieldsShared: string[];
  expectedResponse: string;
  fallback: string;
  expiresInMinutes?: number;
}): HumanAssistanceRequest {
  if (
    !auraFlags.humanAssistanceMeshEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_AURA_HUMAN_ASSISTANCE_MESH_DISABLED");
  }
  if (input.fieldsShared.includes("diagnosis")) {
    throw new Error("AURA_ASSISTANCE_DIAGNOSIS_FORBIDDEN");
  }

  const request: HumanAssistanceRequest = {
    id: randomUUID(),
    userId: input.userId,
    missionId: input.missionId,
    role: input.role,
    recipientLabel: input.recipientLabel,
    purpose: input.purpose,
    fieldsShared: input.fieldsShared,
    fieldsOmitted: ["diagnosis", "full_access_passport", "medical_history"],
    expectedResponse: input.expectedResponse,
    queueState: "pending_approval",
    fallback: input.fallback,
    expiresAt: new Date(
      Date.now() + (input.expiresInMinutes ?? 60) * 60 * 1000,
    ).toISOString(),
    participantApproved: false,
    diagnosisDisclosed: false,
    createdAt: new Date().toISOString(),
  };
  requests.set(request.id, request);
  receipts.set(request.id, [
    {
      id: randomUUID(),
      requestId: request.id,
      event: "drafted",
      at: request.createdAt,
    },
  ]);
  return request;
}

export function approveHumanAssistance(input: {
  requestId: string;
  userId: string;
}): HumanAssistanceRequest {
  const r = requests.get(input.requestId);
  if (!r || r.userId !== input.userId) throw new Error("AURA_ASSISTANCE_FORBIDDEN");
  const updated: HumanAssistanceRequest = {
    ...r,
    participantApproved: true,
    queueState: "queued",
  };
  requests.set(input.requestId, updated);
  const list = receipts.get(input.requestId) ?? [];
  list.push({
    id: randomUUID(),
    requestId: input.requestId,
    event: "participant_approved",
    at: new Date().toISOString(),
  });
  receipts.set(input.requestId, list);
  return updated;
}

export function getAssistanceReceipts(requestId: string): HumanAssistanceReceipt[] {
  return receipts.get(requestId) ?? [];
}

export function getAssistanceRequest(id: string): HumanAssistanceRequest | null {
  return requests.get(id) ?? null;
}
