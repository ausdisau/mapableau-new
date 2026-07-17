import type { BookingStatus, InvoiceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { ParticipantDashboardData } from "@/types/participant-dashboard";

const UPCOMING_STATUSES: BookingStatus[] = [
  "requested",
  "awaiting_provider_acceptance",
  "confirmed",
  "in_progress",
];

const INVOICE_ATTENTION_STATUSES: InvoiceStatus[] = [
  "preflight_failed",
  "approved_for_invoicing",
  "stripe_payment_pending",
  "partially_paid",
];

function formatLocation(
  pickup?: string | null,
  care?: string | null,
): string | null {
  const value = pickup ?? care;
  return value?.trim() || null;
}

function accessibilitySummaryText(
  mobility: unknown,
  communication: unknown,
  hasProfile: boolean,
): string {
  if (!hasProfile) {
    return "You have not added accessibility preferences yet. Adding them helps providers prepare safe support.";
  }
  const mob = Array.isArray(mobility) ? mobility.length : 0;
  const comm = Array.isArray(communication) ? communication.length : 0;
  if (mob === 0 && comm === 0) {
    return "Your accessibility profile is started but empty. Add mobility and communication needs when you are ready.";
  }
  const parts: string[] = [];
  if (mob > 0) parts.push(`${mob} mobility need${mob === 1 ? "" : "s"}`);
  if (comm > 0) {
    parts.push(`${comm} communication preference${comm === 1 ? "" : "s"}`);
  }
  return `You have ${parts.join(" and ")} on file.`;
}

export async function getParticipantDashboardData(
  participantId: string,
  viewAsDelegate: boolean,
): Promise<ParticipantDashboardData> {
  const now = new Date();

  const [
    profile,
    accessibility,
    upcomingBookings,
    recentConversations,
    invoices,
    savedProviders,
    workerPrefs,
    workersFromBookings,
  ] = await Promise.all([
    prisma.participantProfile.findUnique({
      where: { userId: participantId },
      select: { displayName: true, preferredName: true },
    }),
    prisma.accessibilityProfile.findUnique({
      where: { userId: participantId },
    }),
    prisma.booking.findMany({
      where: {
        participantId,
        status: { in: UPCOMING_STATUSES },
        requestedStart: { gte: now },
      },
      orderBy: { requestedStart: "asc" },
      take: 5,
      select: {
        id: true,
        bookingType: true,
        status: true,
        requestedStart: true,
        requestedEnd: true,
        pickupAddress: true,
        careLocation: true,
      },
    }),
    prisma.conversation.findMany({
      where: { participantId },
      orderBy: { lastMessageAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        lastMessageAt: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { body: true },
        },
      },
    }),
    prisma.invoice.findMany({
      where: {
        participantId,
        status: { in: INVOICE_ATTENTION_STATUSES },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        totalCents: true,
        dueDate: true,
      },
    }),
    prisma.participantSavedProvider.findMany({
      where: { participantId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.participantWorkerPreference.findMany({
      where: { participantId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        workerUser: { select: { id: true, name: true } },
      },
    }),
    prisma.booking.findMany({
      where: {
        participantId,
        assignedWorkerId: { not: null },
      },
      distinct: ["assignedWorkerId"],
      take: 6,
      select: {
        assignedWorker: { select: { id: true, name: true } },
      },
    }),
  ]);

  const displayName =
    profile?.preferredName ??
    profile?.displayName ??
    (viewAsDelegate ? "Participant" : "Your dashboard");

  const preferredWorkersMap = new Map<
    string,
    { id: string; workerUserId: string; name: string; label: string | null }
  >();

  for (const pref of workerPrefs) {
    preferredWorkersMap.set(pref.workerUserId, {
      id: pref.id,
      workerUserId: pref.workerUserId,
      name: pref.workerUser.name,
      label: pref.label,
    });
  }

  for (const row of workersFromBookings) {
    const worker = row.assignedWorker;
    if (!worker || preferredWorkersMap.has(worker.id)) continue;
    preferredWorkersMap.set(worker.id, {
      id: `booking-${worker.id}`,
      workerUserId: worker.id,
      name: worker.name,
      label: "From a past booking",
    });
  }

  return {
    participantId,
    displayName,
    viewAsDelegate,
    upcomingBookings: upcomingBookings.map((b) => ({
      id: b.id,
      bookingType: b.bookingType,
      status: b.status,
      requestedStart: b.requestedStart.toISOString(),
      requestedEnd: b.requestedEnd?.toISOString() ?? null,
      locationLabel: formatLocation(b.pickupAddress, b.careLocation),
    })),
    recentMessages: recentConversations.map((c) => ({
      id: c.id,
      conversationId: c.id,
      title: c.title,
      preview: c.messages[0]?.body?.slice(0, 120) ?? "No messages yet",
      lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
    })),
    invoicesNeedingAttention: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      totalCents: inv.totalCents,
      dueDate: inv.dueDate?.toISOString() ?? null,
    })),
    savedProviders: savedProviders.map((sp) => ({
      id: sp.id,
      providerName: sp.providerName,
      providerSlug: sp.providerSlug,
      href: sp.providerSlug
        ? `/providers/${encodeURIComponent(sp.providerSlug)}`
        : "/provider-finder",
    })),
    preferredWorkers: [...preferredWorkersMap.values()],
    accessibility: {
      mobilityCount: Array.isArray(accessibility?.mobilityNeeds)
        ? accessibility.mobilityNeeds.length
        : 0,
      communicationCount: Array.isArray(
        accessibility?.communicationPreferences,
      )
        ? accessibility.communicationPreferences.length
        : 0,
      hasProfile: Boolean(accessibility),
      summaryText: accessibilitySummaryText(
        accessibility?.mobilityNeeds,
        accessibility?.communicationPreferences,
        Boolean(accessibility),
      ),
    },
  };
}

export async function getParticipantProfileSummary(participantId: string) {
  const [user, profile, accessibility] = await Promise.all([
    prisma.user.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        timezone: true,
        primaryRole: true,
      },
    }),
    prisma.participantProfile.findUnique({ where: { userId: participantId } }),
    prisma.accessibilityProfile.findUnique({ where: { userId: participantId } }),
  ]);

  if (!user) return null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      timezone: user.timezone,
    },
    profile: profile
      ? {
          displayName: profile.displayName,
          preferredName: profile.preferredName,
          homeSuburb: profile.homeSuburb,
          homeState: profile.homeState,
        }
      : null,
    accessibilityConfigured: Boolean(accessibility),
  };
}
