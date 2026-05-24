import type { MapAbleUserRole } from "@prisma/client";

export const MOCK_USER_ROLES: MapAbleUserRole[] = [
  "participant",
  "provider_admin",
  "support_worker",
  "driver",
  "support_coordinator",
  "plan_manager",
  "mapable_admin",
];

export const MOCK_USER_BY_ROLE: Record<MapAbleUserRole, { email: string }> = {
  participant: { email: "participant@mapable.test" },
  family_member: { email: "family@mapable.test" },
  support_coordinator: { email: "coordinator@mapable.test" },
  support_worker: { email: "worker@mapable.test" },
  provider_admin: { email: "provider@mapable.test" },
  transport_operator: { email: "transport@mapable.test" },
  driver: { email: "driver@mapable.test" },
  employer: { email: "employer@mapable.test" },
  plan_manager: { email: "planmanager@mapable.test" },
  mapable_admin: { email: "admin@mapable.test" },
};
