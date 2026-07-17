export const CIVIC_ACCESSOPS_NAV = [
  { href: "/civic/assets", label: "Assets", description: "Authorised civic access assets." },
  { href: "/civic/status", label: "Status", description: "Current status with freshness labels." },
  { href: "/civic/incidents", label: "Incidents", description: "Reported civic access disruptions." },
  { href: "/civic/work-orders", label: "Work orders", description: "Repairs and verification queues." },
  { href: "/civic/reliability", label: "Reliability", description: "Feature-level uptime and unknown windows." },
  { href: "/civic/data-sources", label: "Data sources", description: "Source trust, licence, and freshness." },
  { href: "/civic/sensors", label: "Sensors", description: "Read-only sensor health and observations." },
  { href: "/civic/webhooks", label: "Webhooks", description: "Partner subscription readiness." },
  { href: "/civic/reports", label: "Reports", description: "Safe aggregate reports." },
  { href: "/civic/team", label: "Team", description: "Operator access and escalation contacts." },
  { href: "/civic/settings", label: "Settings", description: "Feature flags and governance notices." },
] as const;

export const ADMIN_ACCESSOPS_NAV = [
  { href: "/admin/accessops/assets", label: "Assets", description: "Asset lifecycle and graph readiness." },
  { href: "/admin/accessops/status", label: "Status", description: "Operational status projections." },
  { href: "/admin/accessops/incidents", label: "Incidents", description: "Incident lifecycle and restoration evidence." },
  { href: "/admin/accessops/work-orders", label: "Work orders", description: "Work-order verification queues." },
  { href: "/admin/accessops/reliability", label: "Reliability", description: "Availability windows and unknown coverage." },
  { href: "/admin/accessops/sources", label: "Sources", description: "Source registry and conformance." },
  { href: "/admin/accessops/sensors", label: "Sensors", description: "Sensor trust, health, and no-actuation posture." },
  { href: "/admin/accessops/feeds", label: "Feeds", description: "External feed gates, disabled by default." },
  { href: "/admin/accessops/partners", label: "Partners", description: "Partner API clients and scopes." },
  { href: "/admin/accessops/webhooks", label: "Webhooks", description: "Webhook readiness and disabled production delivery." },
  { href: "/admin/accessops/routes", label: "Routes", description: "Advisory route graph uncertainty." },
  { href: "/admin/accessops/data-quality", label: "Data quality", description: "Completeness, conflicts, and remediation." },
  { href: "/admin/accessops/open-data", label: "Open data", description: "Privacy-filtered OGC export controls." },
  { href: "/admin/accessops/assurance", label: "Assurance", description: "Publication and routing gates." },
] as const;

export function rowsForAccessOpsTopic(topic: string) {
  return [
    {
      label: topic,
      value: "Shell ready",
      note: "Requires authenticated operator access before live data is shown.",
    },
    {
      label: "Privacy",
      value: "Participant journeys hidden",
      note: "Dashboards show asset and status aggregates only.",
    },
    {
      label: "Reliability language",
      value: "Unknown stays unknown",
      note: "Missing data is not interpreted as accessible or available.",
    },
  ];
}
