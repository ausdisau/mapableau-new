import type { RegistrationSlot } from "@/types/registration-chat";

export type RegistrationSessionFields = {
  name: string;
  email: string;
  password: string;
};

export const REGISTRATION_SESSION_STORAGE_KEY =
  "mapable-registration-session-id";

export function emptyRegistrationSession(): RegistrationSessionFields {
  return { name: "", email: "", password: "" };
}

export function getOrCreateRegistrationSessionId(): string {
  if (typeof window === "undefined") return `register-${Date.now()}`;
  let id = sessionStorage.getItem(REGISTRATION_SESSION_STORAGE_KEY);
  if (!id) {
    id = `register-${crypto.randomUUID?.() ?? Date.now()}`;
    sessionStorage.setItem(REGISTRATION_SESSION_STORAGE_KEY, id);
  }
  return id;
}

export function applySlotToSession(
  session: RegistrationSessionFields,
  slot: RegistrationSlot | undefined,
  value: string,
): RegistrationSessionFields {
  const trimmed = value.trim();
  if (!trimmed || !slot) return session;

  switch (slot) {
    case "name":
      return { ...session, name: trimmed };
    case "email":
      return { ...session, email: trimmed };
    case "password":
      return { ...session, password: trimmed };
    default:
      return session;
  }
}
