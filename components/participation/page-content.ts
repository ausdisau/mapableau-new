import type {
  ParticipationNavItem,
  ParticipationSummaryRow,
} from "@/components/participation/ParticipationPageShell";

export const PARTICIPANT_PARTICIPATION_NAV: ParticipationNavItem[] = [
  {
    href: "/participant/participation/goals",
    label: "Goals",
    description: "Write, confirm, pause, or change goals in your words.",
  },
  {
    href: "/participant/participation/discover",
    label: "Discover",
    description: "Search with filters you approve.",
  },
  {
    href: "/participant/participation/plans",
    label: "Plans",
    description: "Draft, approve, execute, or cancel participation plans.",
  },
  {
    href: "/participant/participation/calendar",
    label: "Calendar",
    description: "See referenced calendar items without duplicating events.",
  },
  {
    href: "/participant/participation/reflections",
    label: "Reflections",
    description: "Private reflections that organisers cannot read.",
  },
  {
    href: "/participant/participation/privacy",
    label: "Privacy",
    description: "Sensitive domains default private.",
  },
];

export const ORGANISER_PARTICIPATION_NAV: ParticipationNavItem[] = [
  {
    href: "/community-organiser/profile",
    label: "Profile",
    description: "Community organisation profile and verification.",
  },
  {
    href: "/community-organiser/opportunities",
    label: "Opportunities",
    description: "Draft and maintain opportunity listings.",
  },
  {
    href: "/community-organiser/events",
    label: "Events",
    description: "Publish event details with access provenance.",
  },
  {
    href: "/community-organiser/access",
    label: "Access",
    description: "Describe event access with freshness dates.",
  },
  {
    href: "/community-organiser/status",
    label: "Status",
    description: "Manage listing status without auto-publishing.",
  },
  {
    href: "/community-organiser/questions",
    label: "Questions",
    description: "Answer participant-approved organiser questions.",
  },
  {
    href: "/community-organiser/feedback",
    label: "Feedback",
    description: "Receive safe feedback without private reflections.",
  },
];

export const ADMIN_PARTICIPATION_NAV: ParticipationNavItem[] = [
  {
    href: "/admin/participation/organisations",
    label: "Organisations",
    description: "Community organisation verification and disputes.",
  },
  {
    href: "/admin/participation/opportunities",
    label: "Opportunities",
    description: "Moderation and sponsor separation checks.",
  },
  {
    href: "/admin/participation/events",
    label: "Events",
    description: "Event review and access profile oversight.",
  },
  {
    href: "/admin/participation/moderation",
    label: "Moderation",
    description: "Human review queue for unsafe or unclear listings.",
  },
  {
    href: "/admin/participation/access-quality",
    label: "Access quality",
    description: "Freshness and evidence quality audits.",
  },
  {
    href: "/admin/participation/privacy",
    label: "Privacy",
    description: "Sensitive domain and reflection safeguards.",
  },
  {
    href: "/admin/participation/incidents",
    label: "Incidents",
    description: "Continuity and access disruption follow-up.",
  },
];

export function rowsForParticipationTopic(
  topic: string,
): ParticipationSummaryRow[] {
  return [
    {
      label: topic,
      value: "Shell ready",
      note: "Live data loads only through authenticated APIs.",
    },
    {
      label: "Privacy",
      value: "Default private",
      note: "Faith, advocacy, civic, peer support, and sexuality-related text stay private by default.",
    },
    {
      label: "Access",
      value: "Unknown stays unknown",
      note: "Missing or stale access information is never presented as accessible.",
    },
  ];
}
