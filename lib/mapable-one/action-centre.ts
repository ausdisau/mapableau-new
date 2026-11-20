/**
 * Read-only Action Centre projections from authorised aggregates.
 * Never fabricates bookings, participants, or operational metrics.
 */

export type ActionCentreItem = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  urgency: "info" | "attention" | "critical";
  sourceLabel: string;
};

export type ActionCentreProjection = {
  items: ActionCentreItem[];
  state: "ready" | "empty" | "unavailable";
  message?: string;
};

export type ProviderActionSource = {
  organisationName?: string | null;
  openCareRequests?: number;
  unassignedShifts72h?: number;
  pendingInvites?: number;
  serviceReady?: boolean;
  onboardingBlockerCount?: number;
} | null;

export function buildProviderActionCentre(
  source: ProviderActionSource
): ActionCentreProjection {
  if (!source || !source.organisationName) {
    return {
      items: [],
      state: "unavailable",
      message:
        "Action Centre unavailable — link your account to an organisation to see authorised items.",
    };
  }

  const items: ActionCentreItem[] = [];
  const org = source.organisationName;

  if ((source.onboardingBlockerCount ?? 0) > 0) {
    items.push({
      id: "onboarding",
      title: "Complete provider onboarding",
      detail: `${source.onboardingBlockerCount} blocker(s) remaining for ${org}.`,
      href: "/provider/onboarding",
      urgency: "attention",
      sourceLabel: "Provider onboarding evaluator",
    });
  }

  if ((source.unassignedShifts72h ?? 0) > 0) {
    items.push({
      id: "roster-gaps",
      title: "Roster gaps in the next 72 hours",
      detail: `${source.unassignedShifts72h} unassigned shift(s).`,
      href: "/provider/care",
      urgency: "critical",
      sourceLabel: "Care shift schedule (organisation-scoped)",
    });
  }

  if ((source.openCareRequests ?? 0) > 0) {
    items.push({
      id: "open-requests",
      title: "Open care requests",
      detail: `${source.openCareRequests} request(s) awaiting provider attention.`,
      href: "/provider/care",
      urgency: "attention",
      sourceLabel: "Care requests (organisation-scoped)",
    });
  }

  if ((source.pendingInvites ?? 0) > 0) {
    items.push({
      id: "invites",
      title: "Pending worker invites",
      detail: `${source.pendingInvites} invite(s) outstanding.`,
      href: "/provider/workers",
      urgency: "info",
      sourceLabel: "Worker invitations",
    });
  }

  if (items.length === 0) {
    return {
      items: [],
      state: "empty",
      message: `No open actions for ${org}. Roster and booking views remain available from the sidebar.`,
    };
  }

  return { items, state: "ready" };
}

export type WorkerActionSource = {
  profileLinked: boolean;
  todayShiftCount: number;
  awaitingOfferCount: number;
};

export function buildWorkerActionCentre(
  source: WorkerActionSource
): ActionCentreProjection {
  if (!source.profileLinked) {
    return {
      items: [],
      state: "unavailable",
      message:
        "Action Centre unavailable — no worker profile is linked to this account.",
    };
  }

  const items: ActionCentreItem[] = [];

  if (source.awaitingOfferCount > 0) {
    items.push({
      id: "offers",
      title: "Shift offers awaiting your response",
      detail: `${source.awaitingOfferCount} offer(s) still open.`,
      href: "/worker/today",
      urgency: "attention",
      sourceLabel: "ShiftOffer (assigned worker only)",
    });
  }

  if (source.todayShiftCount > 0) {
    items.push({
      id: "today",
      title: "Shifts scheduled today",
      detail: `${source.todayShiftCount} shift(s) on your roster today.`,
      href: "/worker/today",
      urgency: "info",
      sourceLabel: "CareShift (assigned worker only)",
    });
  }

  if (items.length === 0) {
    return {
      items: [],
      state: "empty",
      message: "No shift actions right now. Check Schedule when it is available for your affiliation.",
    };
  }

  return { items, state: "ready" };
}

export type CoreActionSource = {
  hasBookingsToday: boolean;
  hasTransportToday: boolean;
  bookingCount: number;
};

export function buildCoreActionCentre(
  source: CoreActionSource
): ActionCentreProjection {
  const items: ActionCentreItem[] = [];

  if (source.hasBookingsToday || source.bookingCount > 0) {
    items.push({
      id: "bookings",
      title: "Your arrangements",
      detail:
        source.bookingCount > 0
          ? `${source.bookingCount} item(s) in My Day.`
          : "Open My Day for today’s arrangements.",
      href: "/dashboard",
      urgency: "info",
      sourceLabel: "Participant My Day snapshot",
    });
  }

  if (source.hasTransportToday) {
    items.push({
      id: "transport",
      title: "Transport activity",
      detail: "Transport items appear in your authorised trip list.",
      href: "/dashboard/transport",
      urgency: "info",
      sourceLabel: "Participant transport workspace",
    });
  }

  if (items.length === 0) {
    return {
      items: [],
      state: "empty",
      message:
        "No urgent actions. Use Care, Transport, or Bookings when you are ready — chat is optional.",
    };
  }

  return { items, state: "ready" };
}
