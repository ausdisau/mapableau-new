import { z } from "zod";

import {
  ACCESS_SHARE_CATEGORIES,
  DEFAULT_ACCESS_SHARE_SETTINGS,
  type AccessShareSettings,
} from "@/types/access-passport";

export const accessShareSettingsSchema = z
  .object({
    version: z.literal(1),
    categories: z.array(z.enum(ACCESS_SHARE_CATEGORIES)).max(20),
    /** Verified recipient organisation — authority for consent. */
    recipientOrganisationId: z.string().cuid().nullable().optional(),
    /** Derived display label only — never authority. */
    recipientLabel: z.string().max(200),
    purpose: z.string().min(3).max(500),
    expiresAt: z.string().datetime().nullable(),
    active: z.boolean(),
    updatedAt: z.string().datetime().optional(),
    consentRecordId: z.string().optional(),
  })
  .strict();

export const accessShareSettingsPatchSchema = z
  .object({
    categories: z.array(z.enum(ACCESS_SHARE_CATEGORIES)).max(20),
    recipientOrganisationId: z.string().cuid().nullable(),
    purpose: z.string().min(3).max(500),
    expiresAt: z.string().datetime().nullable(),
    active: z.boolean(),
  })
  .strict();

export function parseAccessShareSettings(value: unknown): AccessShareSettings {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_ACCESS_SHARE_SETTINGS };
  }
  const raw = value as Record<string, unknown>;
  if (!("version" in raw) || raw.version !== 1) {
    return { ...DEFAULT_ACCESS_SHARE_SETTINGS };
  }
  const parsed = accessShareSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...DEFAULT_ACCESS_SHARE_SETTINGS };
  }
  return {
    ...parsed.data,
    recipientOrganisationId: parsed.data.recipientOrganisationId ?? null,
    updatedAt: parsed.data.updatedAt ?? new Date().toISOString(),
  };
}

export function isSharingActive(settings: AccessShareSettings): boolean {
  if (!settings.active || settings.categories.length === 0) return false;
  if (!settings.recipientOrganisationId) return false;
  if (!settings.expiresAt) return true;
  return new Date(settings.expiresAt).getTime() > Date.now();
}

export function shareSettingsMateriallyEqual(
  a: AccessShareSettings,
  b: {
    categories: string[];
    recipientOrganisationId: string | null;
    purpose: string;
    expiresAt: string | null;
    active: boolean;
  },
): boolean {
  if (a.active !== b.active) return false;
  if (a.recipientOrganisationId !== b.recipientOrganisationId) return false;
  if (a.purpose !== b.purpose) return false;
  if (a.expiresAt !== b.expiresAt) return false;
  if (a.categories.length !== b.categories.length) return false;
  const left = [...a.categories].sort().join(",");
  const right = [...b.categories].sort().join(",");
  return left === right;
}
