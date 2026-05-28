import type { CurrentUser } from "@/lib/auth/current-user";
import {
  getAccountCentrePersona,
  userHasPermission,
} from "@/lib/auth/account-access";

export type AccountCentreSections = {
  identity: boolean;
  profile: boolean;
  accessibility: boolean;
  consent: boolean;
  billing: boolean;
  notifications: boolean;
  security: boolean;
  organisation: boolean;
  workerProfile: boolean;
  portals: boolean;
};

export function getAccountCentreSections(
  user: CurrentUser
): AccountCentreSections {
  const persona = getAccountCentrePersona(user);
  const canRead = userHasPermission(user, "account:read:self");

  if (!canRead) {
    return {
      identity: false,
      profile: false,
      accessibility: false,
      consent: false,
      billing: false,
      notifications: false,
      security: false,
      organisation: false,
      workerProfile: false,
      portals: false,
    };
  }

  const isParticipantFamily =
    persona === "participant" ||
    user.roles.includes("participant") ||
    user.roles.includes("family_member");

  return {
    identity: true,
    profile:
      isParticipantFamily && userHasPermission(user, "profile:read:self"),
    accessibility:
      isParticipantFamily &&
      userHasPermission(user, "accessibility:read:self"),
    consent:
      isParticipantFamily && userHasPermission(user, "consent:manage:self"),
    billing:
      (isParticipantFamily && userHasPermission(user, "invoice:read:self")) ||
      (persona === "provider" && userHasPermission(user, "invoice:read:org")),
    notifications: userHasPermission(user, "notification:read:self"),
    security: true,
    organisation:
      persona === "provider" ||
      persona === "worker" ||
      userHasPermission(user, "care:read:org"),
    workerProfile:
      persona === "worker" || userHasPermission(user, "care:shift:work"),
    portals:
      persona === "provider" ||
      persona === "worker" ||
      userHasPermission(user, "enterprise:console") ||
      userHasPermission(user, "care:shift:work"),
  };
}
