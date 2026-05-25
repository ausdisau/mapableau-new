import type { MapAbleUserRole } from "@prisma/client";

/** Self-selected account type at registration — not proof of provider/worker status. */
export type RegistrationAccountType =
  | "participant"
  | "nominee_or_carer"
  | "provider"
  | "support_worker"
  | "driver"
  | "support_coordinator"
  | "plan_manager";

export const REGISTRATION_ACCOUNT_TYPES: {
  id: RegistrationAccountType;
  label: string;
  description: string;
}[] = [
  {
    id: "participant",
    label: "Participant",
    description: "I receive disability supports or use NDIS funding.",
  },
  {
    id: "nominee_or_carer",
    label: "Nominee or carer",
    description: "I support a participant with bookings, transport or consent.",
  },
  {
    id: "provider",
    label: "Provider organisation",
    description: "I represent a care, therapy or community provider.",
  },
  {
    id: "support_worker",
    label: "Support worker",
    description: "I deliver hands-on support for participants.",
  },
  {
    id: "driver",
    label: "Driver",
    description: "I provide accessible transport or community driving.",
  },
  {
    id: "support_coordinator",
    label: "Support coordinator",
    description: "I help participants connect with services and plans.",
  },
  {
    id: "plan_manager",
    label: "Plan manager",
    description: "I manage NDIS plan budgets and invoices.",
  },
];

export function mapRegistrationTypeToPrimaryRole(
  accountType: RegistrationAccountType,
): MapAbleUserRole {
  const map: Record<RegistrationAccountType, MapAbleUserRole> = {
    participant: "participant",
    nominee_or_carer: "family_member",
    provider: "provider_admin",
    support_worker: "support_worker",
    driver: "driver",
    support_coordinator: "support_coordinator",
    plan_manager: "plan_manager",
  };
  return map[accountType];
}

/** Roles that must never be self-assigned at registration. */
export const BLOCKED_SELF_REGISTRATION_ROLES: MapAbleUserRole[] = [
  "mapable_admin",
];
