/**
 * Canonical UI paths shared across modules (dashboard, care, core hub, care-support).
 * Import these instead of hard-coding parallel paths (e.g. /dashboard/care vs /care).
 */

export const routes = {
  core: {
    hub: "/core",
    dashboard: "/dashboard",
    ask: "/ask",
    dataVault: "/data-vault",
  },

  /** Participant care module (MapAble Care MVP) */
  care: {
    hub: "/care",
    request: "/care/request",
    bookings: "/care/bookings",
    booking: (id: string) => `/care/bookings/${id}` as const,
    serviceLogs: "/care/service-logs",
    findProviders: "/provider-finder",
    shifts: "/care/shifts",
    shift: (id: string) => `/care/shifts/${id}` as const,
    support: {
      hub: "/care/support",
      assessment: "/care/support/assessment",
      referrals: "/care/support/referrals",
      referralNew: "/care/support/referrals/new",
      coordination: "/care/support/coordination",
    },
  },

  /** Support coordinator portal */
  coordinator: {
    hub: "/support-coordinator",
    participants: "/support-coordinator/participants",
    participant: (id: string) => `/support-coordinator/participants/${id}` as const,
    tasks: "/support-coordinator/tasks",
    access: "/support-coordinator/access",
  },

  /** Communication centre (canonical messaging UI) */
  messages: {
    hub: "/messages",
    thread: (id: string) => `/messages/${id}` as const,
  },

  /** Stripe billing-core participant billing */
  billing: {
    hub: "/billing",
  },

  /** Generic dashboard portal (profile, transport, jobs, etc.) */
  dashboard: {
    hub: "/dashboard",
    profile: "/dashboard/profile",
    consent: "/dashboard/consent",
    bookings: "/dashboard/bookings",
    transport: "/dashboard/transport",
    incidents: "/dashboard/incidents",
    incidentNew: "/dashboard/incidents/new",
    findSupport: "/dashboard/find-support",
  },

  provider: {
    finder: "/provider-finder",
    care: {
      hub: "/provider/care",
      requests: "/provider/care/requests",
    },
  },

  worker: {
    today: "/worker/today",
    shift: (id: string) => `/worker/shifts/${id}` as const,
    reportIssue: "/worker/report-issue",
  },
} as const;

/**
 * Legacy paths kept for bookmarks; prefer next.config redirects + thin page redirects.
 */
export const legacyRoutes = {
  dashboardCare: "/dashboard/care",
  dashboardCareNew: "/dashboard/care/new",
  dashboardCareShifts: "/dashboard/care/shifts",
  dashboardMessages: "/dashboard/messages",
  dashboardInvoices: "/dashboard/invoices",
} as const;

/** Nav entries for participant "services" — single list for core hub + dashboard sidebars */
export const participantServiceNavLinks = [
  { href: routes.core.ask, label: "Ask MapAble", description: "Co-Pilot guidance with PRMS records underneath" },
  { href: routes.core.dashboard, label: "Dashboard", description: "Bookings, care, transport and profile" },
  { href: routes.dashboard.bookings, label: "Bookings" },
  { href: routes.care.hub, label: "Care" },
  {
    href: routes.care.support.hub,
    label: "Care & support",
    description: "Support needs assessment, referrals, and coordination",
  },
  { href: routes.dashboard.transport, label: "Transport" },
  { href: routes.core.dataVault, label: "Data vault", description: "Export or portability requests" },
] as const;
