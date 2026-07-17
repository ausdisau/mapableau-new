import type { ParticipationPrivacyLevelValue } from "@/lib/participation/types";

const PRIVATE_LEVELS: ReadonlySet<ParticipationPrivacyLevelValue> = new Set([
  "private",
  "household",
  "authorised_support",
]);

export function shouldRedactForOrganiser(
  privacyLevel: ParticipationPrivacyLevelValue | null | undefined,
): boolean {
  if (!privacyLevel) return true;
  return PRIVATE_LEVELS.has(privacyLevel);
}

export function redactSensitiveParticipationText(
  value: string | null | undefined,
  privacyLevel: ParticipationPrivacyLevelValue | null | undefined,
): string | null {
  if (!value) return null;
  if (shouldRedactForOrganiser(privacyLevel)) return "[redacted]";
  return value;
}

export function redactReflectionForOrganiser<
  T extends { body?: string; mood?: string },
>(reflection: T): Omit<T, "body" | "mood"> & { body: string; mood: null } {
  const { body: _body, mood: _mood, ...rest } = reflection;
  return { ...rest, body: "[private reflection]", mood: null };
}
