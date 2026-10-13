import { randomUUID } from "node:crypto";

import { isAgencyMemoryEnabled } from "@/lib/config/agency-memory";

import { detectConflicts } from "./conflicts";
import {
  assertDelegateMayNotExceedAuthority,
  assessDelegateMemoryWrite,
} from "./delegates";
import { rebuildPreferenceGraph } from "./graph";
import { assertGovernedCategory, getCategoryEntry } from "./registry";
import type {
  ConfirmMemoryInput,
  ControlsUpdateInput,
  DeleteMemoryInput,
  EditMemoryInput,
  ProposeMemoryInput,
  RevokeMemoryInput,
} from "./schemas";
import {
  assertPurposeForCategory,
  assertSameTenant,
  isExpired,
} from "./scope";
import {
  appendAuditVersion,
  getControls,
  getMemoryItem,
  listMemoryItems,
  saveControls,
  saveMemoryItem,
} from "./store";
import type { MapAbleAgencyMemoryItem, MemorySource } from "./types";
import { NON_CONFIRMING_SOURCES } from "./types";

function assertEnabled(): void {
  if (!isAgencyMemoryEnabled()) {
    throw new Error("AGENCY_MEMORY_DISABLED");
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

export function assertSourceMayPersist(source: MemorySource): void {
  if (source === "model_proposed") {
    return;
  }
}

export function assertCannotPersistInferenceAsConfirmed(params: {
  source: MemorySource;
  confirmationState: string;
}): void {
  if (
    NON_CONFIRMING_SOURCES.includes(params.source) &&
    params.confirmationState === "confirmed"
  ) {
    throw new Error("AGENCY_MEMORY_INFERENCE_CANNOT_CONFIRM");
  }
}

export function proposeMemory(
  input: ProposeMemoryInput,
): MapAbleAgencyMemoryItem {
  assertEnabled();
  assertGovernedCategory(input.category);
  assertPurposeForCategory({
    category: input.category,
    purpose: input.purpose,
  });
  assertSourceMayPersist(input.source);

  const delegateAssessment = assessDelegateMemoryWrite({
    actorId: input.actorId,
    participantId: input.participantId,
    delegate: input.delegate,
    source: input.source,
  });
  assertDelegateMayNotExceedAuthority(delegateAssessment);

  const isParticipantActor = input.actorId === input.participantId;
  const canAutoConfirm =
    isParticipantActor &&
    input.autoConfirmIfParticipantExplicit &&
    (input.source === "participant_explicit" ||
      input.source === "participant_confirmed") &&
    !delegateAssessment.mustProposeOnly;

  if (
    canAutoConfirm === false &&
    input.source === "model_proposed" &&
    input.autoConfirmIfParticipantExplicit
  ) {
    throw new Error("AGENCY_MEMORY_INFERENCE_CANNOT_CONFIRM");
  }

  const now = nowIso();
  const item: MapAbleAgencyMemoryItem = {
    memoryId: randomUUID(),
    participantId: input.participantId,
    tenantId: input.tenantId,
    category: input.category,
    statement: input.statement,
    structuredValue: input.structuredValue,
    source: input.source,
    confirmationState: canAutoConfirm ? "confirmed" : "proposed",
    confirmedAt: canAutoConfirm ? now : undefined,
    effectiveFrom: now,
    expiresAt: input.expiresAt ?? undefined,
    consentScopes: input.consentScopes,
    visibility: input.visibility,
    editable: true,
    deletable: true,
    version: 1,
    supersedes: input.supersedes,
    evidenceRefs: input.evidenceRefs,
    purpose: input.purpose,
    delegate: input.delegate,
    createdAt: now,
    updatedAt: now,
  };

  assertCannotPersistInferenceAsConfirmed({
    source: item.source,
    confirmationState: item.confirmationState,
  });

  if (input.supersedes) {
    const prior = getMemoryItem({
      memoryId: input.supersedes,
      participantId: input.participantId,
      tenantId: input.tenantId,
    });
    if (prior && canAutoConfirm) {
      appendAuditVersion(prior);
      saveMemoryItem({
        ...prior,
        confirmationState: "superseded",
        updatedAt: now,
      });
    }
  }

  saveMemoryItem(item);
  rebuildPreferenceGraph({
    participantId: input.participantId,
    tenantId: input.tenantId,
  });
  return item;
}

export function confirmMemory(
  input: ConfirmMemoryInput,
): MapAbleAgencyMemoryItem {
  assertEnabled();
  if (input.actorId !== input.participantId) {
    throw new Error("AGENCY_MEMORY_CONFIRM_REQUIRES_PARTICIPANT");
  }

  const item = getMemoryItem(input);
  if (!item) throw new Error("AGENCY_MEMORY_NOT_FOUND");
  assertSameTenant({
    itemTenantId: item.tenantId,
    requestTenantId: input.tenantId,
  });

  if (item.deletedAt) throw new Error("AGENCY_MEMORY_DELETED");
  if (item.confirmationState === "revoked") {
    throw new Error("AGENCY_MEMORY_REVOKED");
  }
  if (item.confirmationState === "superseded") {
    throw new Error("AGENCY_MEMORY_SUPERSEDED");
  }

  const now = nowIso();
  const confirmed: MapAbleAgencyMemoryItem = {
    ...item,
    confirmationState: "confirmed",
    confirmedAt: now,
    source:
      item.source === "model_proposed" ||
      item.source === "system_proposed" ||
      item.source === "delegate_proposed"
        ? "participant_confirmed"
        : item.source === "participant_explicit"
          ? "participant_explicit"
          : "participant_confirmed",
    consentScopes: input.consentScopes ?? item.consentScopes,
    updatedAt: now,
    version: item.version + 1,
  };

  if (item.supersedes) {
    const prior = getMemoryItem({
      memoryId: item.supersedes,
      participantId: input.participantId,
      tenantId: input.tenantId,
    });
    if (prior && prior.confirmationState === "confirmed") {
      appendAuditVersion(prior);
      saveMemoryItem({
        ...prior,
        confirmationState: "superseded",
        updatedAt: now,
      });
    }
  }

  appendAuditVersion(item);
  saveMemoryItem(confirmed);
  rebuildPreferenceGraph({
    participantId: input.participantId,
    tenantId: input.tenantId,
  });
  void detectConflicts({
    participantId: input.participantId,
    tenantId: input.tenantId,
    category: confirmed.category,
  });
  return confirmed;
}

export function revokeMemory(
  input: RevokeMemoryInput,
): MapAbleAgencyMemoryItem {
  assertEnabled();
  if (input.actorId !== input.participantId) {
    throw new Error("AGENCY_MEMORY_REVOKE_REQUIRES_PARTICIPANT");
  }
  const item = getMemoryItem(input);
  if (!item) throw new Error("AGENCY_MEMORY_NOT_FOUND");
  assertSameTenant({
    itemTenantId: item.tenantId,
    requestTenantId: input.tenantId,
  });

  const now = nowIso();
  appendAuditVersion(item);
  const revoked: MapAbleAgencyMemoryItem = {
    ...item,
    confirmationState: "revoked",
    updatedAt: now,
    version: item.version + 1,
  };
  saveMemoryItem(revoked);
  rebuildPreferenceGraph({
    participantId: input.participantId,
    tenantId: input.tenantId,
  });
  return revoked;
}

export function deleteMemory(
  input: DeleteMemoryInput,
): MapAbleAgencyMemoryItem {
  assertEnabled();
  if (input.actorId !== input.participantId) {
    throw new Error("AGENCY_MEMORY_DELETE_REQUIRES_PARTICIPANT");
  }
  const item = getMemoryItem(input);
  if (!item) throw new Error("AGENCY_MEMORY_NOT_FOUND");
  assertSameTenant({
    itemTenantId: item.tenantId,
    requestTenantId: input.tenantId,
  });
  if (!item.deletable) {
    throw new Error("AGENCY_MEMORY_NOT_DELETABLE");
  }

  const now = nowIso();
  appendAuditVersion(item);
  const deleted: MapAbleAgencyMemoryItem = {
    ...item,
    confirmationState:
      item.confirmationState === "confirmed"
        ? "revoked"
        : item.confirmationState,
    deletedAt: now,
    updatedAt: now,
    version: item.version + 1,
  };
  saveMemoryItem(deleted);
  rebuildPreferenceGraph({
    participantId: input.participantId,
    tenantId: input.tenantId,
  });
  return deleted;
}

export function editMemory(input: EditMemoryInput): MapAbleAgencyMemoryItem {
  assertEnabled();
  if (input.actorId !== input.participantId) {
    throw new Error("AGENCY_MEMORY_EDIT_REQUIRES_PARTICIPANT");
  }
  const item = getMemoryItem(input);
  if (!item) throw new Error("AGENCY_MEMORY_NOT_FOUND");
  assertSameTenant({
    itemTenantId: item.tenantId,
    requestTenantId: input.tenantId,
  });
  if (!item.editable || item.deletedAt) {
    throw new Error("AGENCY_MEMORY_NOT_EDITABLE");
  }

  const now = nowIso();
  appendAuditVersion(item);
  const edited: MapAbleAgencyMemoryItem = {
    ...item,
    statement: input.statement ?? item.statement,
    structuredValue:
      input.structuredValue !== undefined
        ? input.structuredValue
        : item.structuredValue,
    expiresAt:
      input.expiresAt === null
        ? undefined
        : (input.expiresAt ?? item.expiresAt),
    visibility: input.visibility ?? item.visibility,
    consentScopes: input.consentScopes ?? item.consentScopes,
    purpose:
      input.purpose === null ? undefined : (input.purpose ?? item.purpose),
    provenanceCorrection:
      input.provenanceCorrection ?? item.provenanceCorrection,
    updatedAt: now,
    version: item.version + 1,
  };
  saveMemoryItem(edited);
  rebuildPreferenceGraph({
    participantId: input.participantId,
    tenantId: input.tenantId,
  });
  return edited;
}

export function updateControls(input: ControlsUpdateInput): ReturnType<
  typeof getControls
> {
  assertEnabled();
  if (input.actorId !== input.participantId) {
    throw new Error("AGENCY_MEMORY_CONTROLS_REQUIRE_PARTICIPANT");
  }
  const current = getControls(input);
  const next = {
    participantId: input.participantId,
    personalisationPaused:
      input.personalisationPaused ?? current.personalisationPaused,
    aiUseDisabled: input.aiUseDisabled ?? current.aiUseDisabled,
    updatedAt: nowIso(),
  };
  saveControls({ ...next, tenantId: input.tenantId });
  return next;
}

export function expireStaleMemory(params: {
  participantId: string;
  tenantId: string;
}): number {
  assertEnabled();
  let count = 0;
  for (const item of listMemoryItems(params)) {
    if (
      item.confirmationState === "confirmed" &&
      isExpired(item) &&
      !item.deletedAt
    ) {
      appendAuditVersion(item);
      saveMemoryItem({
        ...item,
        confirmationState: "expired",
        updatedAt: nowIso(),
        version: item.version + 1,
      });
      count += 1;
    }
  }
  if (count) {
    rebuildPreferenceGraph(params);
  }
  return count;
}

export function categoryPlainLanguage(category: string): string {
  try {
    return getCategoryEntry(assertGovernedCategory(category)).plainLanguage;
  } catch {
    return "Unknown category";
  }
}
