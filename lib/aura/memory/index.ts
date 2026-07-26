import { randomUUID } from "crypto";

import { escapeHtml } from "@/lib/aura/memory/html-escape";
import {
  wave5MemoryEnabled,
  wave5MemorySuggestionsEnabled,
} from "@/lib/aura/wave5-flags";
import { appendWitness } from "@/lib/aura/witness";

export type AuraMemoryCategory =
  | "interaction"
  | "explanation"
  | "routing"
  | "supporter_involvement"
  | "notification"
  | "privacy"
  | "mission_workflow";

export type AuraMemoryCanonicalDestination =
  | "aura_memory"
  | "accessibility_profile"
  | "access_passport"
  | "notification_preferences";

export type AuraMemorySource =
  | "participant_authored"
  | "participant_confirmed_suggestion"
  | "imported_with_confirmation";

export type AuraMemoryCard = {
  id: string;
  userId: string;
  title: string;
  participantWording: string;
  structuredPreference?: {
    key: string;
    value: boolean | number | string | string[];
  };
  category: AuraMemoryCategory;
  canonicalDestination: AuraMemoryCanonicalDestination;
  source: AuraMemorySource;
  allowedModules: string[];
  sensitivity: "personal" | "sensitive";
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  active: boolean;
  deletedAt?: string;
  version: number;
  previousVersionId?: string;
  auditCorrelationId: string;
};

export type AuraMemorySuggestion = {
  id: string;
  userId: string;
  proposedTitle: string;
  proposedWording: string;
  structuredPreference?: AuraMemoryCard["structuredPreference"];
  category: AuraMemoryCategory;
  canonicalDestination: AuraMemoryCanonicalDestination;
  allowedModules: string[];
  sensitivity: "personal" | "sensitive";
  expiresAt?: string;
  dismissedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  cooldownUntil?: string;
};

const cards = new Map<string, AuraMemoryCard>();
const suggestions = new Map<string, AuraMemorySuggestion>();
const profileUpdates = new Map<string, Record<string, unknown>>();

const FORBIDDEN_SOURCES = new Set(["model_inferred", "inferred", "auto"]);

export function resetMemoryStore(): void {
  cards.clear();
  suggestions.clear();
  profileUpdates.clear();
}

function assertMemoryEnabled(): void {
  if (!wave5MemoryEnabled()) {
    throw new Error("MAPABLE_AURA_MEMORY_DISABLED");
  }
}

export function classifyCanonicalDestination(input: {
  key: string;
  category: AuraMemoryCategory;
}): AuraMemoryCanonicalDestination {
  const k = input.key.toLowerCase();
  if (
    k.includes("doorway") ||
    k.includes("step_free") ||
    k.includes("lift_requirement") ||
    k.includes("toilet_requirement") ||
    k.includes("mobility")
  ) {
    return "access_passport";
  }
  if (
    k.includes("communication") ||
    k.includes("presentation") ||
    k.includes("written_directions") ||
    k.includes("step_by_step")
  ) {
    return "accessibility_profile";
  }
  if (k.includes("channel") || k.includes("quiet_hours") || k.includes("alert")) {
    return "notification_preferences";
  }
  return "aura_memory";
}

export function createMemoryCard(input: {
  userId: string;
  title: string;
  participantWording: string;
  structuredPreference?: AuraMemoryCard["structuredPreference"];
  category: AuraMemoryCategory;
  canonicalDestination?: AuraMemoryCanonicalDestination;
  source: AuraMemorySource;
  allowedModules: string[];
  sensitivity?: "personal" | "sensitive";
  expiresAt?: string;
}):
  | AuraMemoryCard
  | { routedTo: AuraMemoryCanonicalDestination; profileUpdate: Record<string, unknown> } {
  assertMemoryEnabled();
  if (FORBIDDEN_SOURCES.has(input.source)) {
    throw new Error("AURA_MEMORY_INFERRED_FORBIDDEN");
  }
  if (input.participantWording.toLowerCase().includes("consent")) {
    throw new Error("AURA_MEMORY_CONSENT_FORBIDDEN");
  }

  const destination =
    input.canonicalDestination ??
    classifyCanonicalDestination({
      key: input.structuredPreference?.key ?? input.title,
      category: input.category,
    });

  if (destination !== "aura_memory") {
    const update = {
      key: input.structuredPreference?.key ?? input.title,
      value: input.structuredPreference?.value ?? input.participantWording,
      destination,
    };
    profileUpdates.set(`${input.userId}:${destination}`, update);
    appendWitness({
      missionId: "memory",
      type: "memory.canonical_profile_update_requested",
      summary: `Routed preference to ${destination}`,
      correlationId: randomUUID(),
      actorType: "participant",
      actorId: input.userId,
      payload: update,
    });
    return { routedTo: destination, profileUpdate: update };
  }

  const card: AuraMemoryCard = {
    id: randomUUID(),
    userId: input.userId,
    title: input.title,
    participantWording: input.participantWording,
    structuredPreference: input.structuredPreference,
    category: input.category,
    canonicalDestination: destination,
    source: input.source,
    allowedModules: input.allowedModules,
    sensitivity: input.sensitivity ?? "personal",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: input.expiresAt,
    active: true,
    version: 1,
    auditCorrelationId: randomUUID(),
  };
  cards.set(card.id, card);
  appendWitness({
    missionId: "memory",
    type: "memory.card_created",
    summary: card.title,
    correlationId: card.auditCorrelationId,
    actorType: "participant",
    actorId: input.userId,
    payload: { memoryId: card.id, destination },
  });
  return card;
}

export function listMemoryCards(userId: string): AuraMemoryCard[] {
  return [...cards.values()].filter(
    (c) =>
      c.userId === userId &&
      !c.deletedAt &&
      c.active &&
      (!c.expiresAt || Date.parse(c.expiresAt) > Date.now()),
  );
}

export function getMemoryCard(id: string, userId: string): AuraMemoryCard | null {
  const c = cards.get(id);
  if (!c || c.userId !== userId || c.deletedAt) return null;
  return c;
}

export function deleteMemoryCard(id: string, userId: string): void {
  assertMemoryEnabled();
  const existing = cards.get(id);
  if (!existing || existing.userId !== userId) {
    throw new Error("AURA_MEMORY_NOT_FOUND");
  }
  cards.set(id, {
    ...existing,
    active: false,
    deletedAt: new Date().toISOString(),
  });
  appendWitness({
    missionId: "memory",
    type: "memory.card_deleted",
    summary: "Memory card deleted (tombstone retained)",
    correlationId: existing.auditCorrelationId,
    actorType: "participant",
    actorId: userId,
    payload: { memoryId: id },
  });
}

export function exportMemory(userId: string): {
  html: string;
  json: Record<string, unknown>;
  summary: string;
} {
  assertMemoryEnabled();
  const active = listMemoryCards(userId);
  const inactive = [...cards.values()].filter(
    (c) => c.userId === userId && (!c.active || c.deletedAt),
  );
  const json = {
    active,
    inactive: inactive.map((c) => ({
      id: c.id,
      title: c.title,
      deletedAt: c.deletedAt,
      version: c.version,
    })),
    exportedAt: new Date().toISOString(),
  };
  const summary = `You have ${active.length} active AURA memory preference(s).`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>AURA Memory Export</title></head><body><h1>AURA Memory Export</h1><p>${escapeHtml(summary)}</p><ul>${active
    .map(
      (c) =>
        `<li><strong>${escapeHtml(c.title)}</strong>: ${escapeHtml(c.participantWording)}</li>`,
    )
    .join("")}</ul></body></html>`;
  appendWitness({
    missionId: "memory",
    type: "memory.card_exported",
    summary: "Memory export generated",
    correlationId: randomUUID(),
    actorType: "participant",
    actorId: userId,
    payload: { count: active.length },
  });
  return { html, json, summary };
}

export function createMemorySuggestion(input: {
  userId: string;
  proposedTitle: string;
  proposedWording: string;
  structuredPreference?: AuraMemoryCard["structuredPreference"];
  category: AuraMemoryCategory;
  allowedModules: string[];
}): AuraMemorySuggestion | null {
  if (!wave5MemorySuggestionsEnabled()) return null;
  const suggestion: AuraMemorySuggestion = {
    id: randomUUID(),
    userId: input.userId,
    proposedTitle: input.proposedTitle,
    proposedWording: input.proposedWording,
    structuredPreference: input.structuredPreference,
    category: input.category,
    canonicalDestination: classifyCanonicalDestination({
      key: input.structuredPreference?.key ?? input.proposedTitle,
      category: input.category,
    }),
    allowedModules: input.allowedModules,
    sensitivity: "personal",
    createdAt: new Date().toISOString(),
  };
  suggestions.set(suggestion.id, suggestion);
  return suggestion;
}

export { escapeHtml };
