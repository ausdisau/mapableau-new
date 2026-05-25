import type { RegistrationRole } from "@/types/registration";

export const AU_STATES = [
  "ACT",
  "NSW",
  "NT",
  "QLD",
  "SA",
  "TAS",
  "VIC",
  "WA",
] as const;

export const ROLE_LABELS: Record<RegistrationRole, string> = {
  participant: "Participant (NDIS or disability support)",
  nominee_or_family: "Nominee or family supporter",
  provider: "Service provider organisation",
  support_worker: "Support worker",
  driver: "Transport driver",
  allied_health_practitioner: "Allied health practitioner",
  support_coordinator: "Support coordinator",
  plan_manager: "Plan manager",
  employer: "Inclusive employer",
};

export const ROLE_DESCRIPTIONS: Record<RegistrationRole, string> = {
  participant:
    "Find and book disability supports that work for you.",
  nominee_or_family:
    "Help someone you support manage services — with their consent.",
  provider:
    "List your organisation after verification. No bank details at signup.",
  support_worker:
    "Offer support services after identity and screening checks.",
  driver:
    "Provide accessible transport after licence and vehicle verification.",
  allied_health_practitioner:
    "Offer clinical services after credential review where required.",
  support_coordinator:
    "Coordinate supports — participant access needs consent links.",
  plan_manager:
    "Manage plans and invoices — access needs participant consent.",
  employer:
    "Post inclusive jobs after profile review.",
};
