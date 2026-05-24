import type { UserRole } from "./mapable";

/** Prompt-pack role names mapped to persisted Prisma roles */
export const PROMPT_ROLE_ALIASES: Record<string, UserRole> = {
  nominee: "family_member",
  carer: "family_member",
};

export type PromptPackRole =
  | UserRole
  | "nominee"
  | "carer";

export function resolvePromptRole(role: PromptPackRole): UserRole {
  if (role in PROMPT_ROLE_ALIASES) {
    return PROMPT_ROLE_ALIASES[role as keyof typeof PROMPT_ROLE_ALIASES];
  }
  return role as UserRole;
}

export interface CoreProfileSummary {
  userId: string;
  displayName: string;
  email: string;
  primaryRole: UserRole;
  unreadNotifications: number;
}
