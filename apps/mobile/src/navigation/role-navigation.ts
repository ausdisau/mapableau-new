
import type { MobileFeatureFlags } from "@mapable/feature-flags";
import type { AppRole } from "@mapable/validation";

export type NavItem = {
  key: string;
  title: string;
  href: string;
  enabled: boolean;
};

export function resolveNavigationMode(
  role: AppRole,
  flags: MobileFeatureFlags,
): "participant" | "worker" | "coordinator" {
  if (
    (role === "support_worker" || role === "transport_operator") &&
    flags.MAPABLE_MOBILE_WORKER_ENABLED
  ) {
    return "worker";
  }
  if (role === "support_coordinator" && flags.MAPABLE_MOBILE_COORDINATOR_ENABLED) {
    return "coordinator";
  }
  return "participant";
}

export function participantTabs(flags: MobileFeatureFlags): NavItem[] {
  return [
    { key: "today", title: "Today", href: "/(participant)/today", enabled: true },
    { key: "careos", title: "CareOS", href: "/(participant)/careos", enabled: true },
    { key: "care", title: "Care", href: "/(participant)/care", enabled: true },
    { key: "transport", title: "Transport", href: "/(participant)/transport", enabled: true },
    { key: "more", title: "More", href: "/(participant)/more", enabled: true },
  ].filter((i) => flags.MAPABLE_MOBILE_PARTICIPANT_ENABLED || i.key === "more");
}

export function participantMoreLinks(flags: MobileFeatureFlags): NavItem[] {
  return [
    { key: "access", title: "Access", href: "/(participant)/access", enabled: true },
    {
      key: "jobs",
      title: "Jobs",
      href: "/(participant)/jobs",
      enabled: flags.MAPABLE_MOBILE_PARTICIPANT_ENABLED,
    },
    {
      key: "moves",
      title: "Moves",
      href: "/(participant)/moves",
      enabled: flags.MAPABLE_MOBILE_PARTICIPANT_ENABLED,
    },
    {
      key: "abilitypay",
      title: "AbilityPay",
      href: "/(participant)/abilitypay",
      enabled: flags.MAPABLE_MOBILE_PARTICIPANT_ENABLED,
    },
    {
      key: "home-living",
      title: "Home and Living",
      href: "/(participant)/home-living",
      enabled: flags.MAPABLE_MOBILE_PARTICIPANT_ENABLED,
    },
    { key: "documents", title: "Documents", href: "/(participant)/documents", enabled: true },
    { key: "messages", title: "Messages", href: "/(participant)/messages", enabled: true },
    {
      key: "notifications",
      title: "Notifications",
      href: "/(participant)/notifications",
      enabled: flags.MAPABLE_MOBILE_PUSH_ENABLED,
    },
    { key: "privacy", title: "Privacy", href: "/(participant)/privacy", enabled: true },
    { key: "settings", title: "Settings", href: "/(participant)/settings", enabled: true },
    { key: "help", title: "Human help", href: "/(participant)/help", enabled: true },
  ].filter((i) => i.enabled);
}

export function workerTabs(): NavItem[] {
  return [
    { key: "today", title: "Today", href: "/(worker)/today", enabled: true },
    { key: "shifts", title: "Shifts", href: "/(worker)/shifts", enabled: true },
    { key: "messages", title: "Messages", href: "/(worker)/messages", enabled: true },
    { key: "credentials", title: "Credentials", href: "/(worker)/credentials", enabled: true },
    { key: "profile", title: "Profile", href: "/(worker)/profile", enabled: true },
  ];
}

export function coordinatorTabs(): NavItem[] {
  return [
    { key: "caseload", title: "Caseload", href: "/(coordinator)/caseload", enabled: true },
    { key: "reviews", title: "Reviews", href: "/(coordinator)/reviews", enabled: true },
    { key: "continuity", title: "Continuity", href: "/(coordinator)/continuity", enabled: true },
    { key: "tasks", title: "Tasks", href: "/(coordinator)/tasks", enabled: true },
    { key: "profile", title: "Profile", href: "/(coordinator)/profile", enabled: true },
  ];
}
