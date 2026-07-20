import { normalizeAuthEmail } from "@/lib/auth/auth-flow";

export const REGISTRATION_START_SENTINEL = "__registration_start__";
export const REGISTRATION_PASSWORD_SENTINEL = "__registration_password_set__";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidRegistrationEmail(email: string): boolean {
  return EMAIL_PATTERN.test(normalizeAuthEmail(email));
}

export function validateRegistrationPassword(password: string): string | null {
  const trimmed = password.trim();
  if (!trimmed) return "Password is required";
  if (trimmed.length < 8) return "Password must be at least 8 characters";
  return null;
}

export function parseNameFromUserText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (EMAIL_PATTERN.test(normalizeAuthEmail(trimmed))) return null;
  return trimmed;
}

export function parseEmailFromUserText(text: string): string | null {
  const normalized = normalizeAuthEmail(text);
  if (!isValidRegistrationEmail(normalized)) return null;
  return normalized;
}

export function registrationErrorMessage(code?: string, fallback?: string): string {
  switch (code) {
    case "EMAIL_ALREADY_REGISTERED":
      return "An account with this email already exists. Try signing in instead.";
    default:
      return fallback ?? "Something went wrong. Please try again.";
  }
}
