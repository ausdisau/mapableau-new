export type ParticipantUpcomingBooking = {
  id: string;
  bookingType: string;
  status: string;
  requestedStart: string;
  requestedEnd: string | null;
  locationLabel: string | null;
};

export type ParticipantMessagePreview = {
  id: string;
  conversationId: string;
  title: string;
  preview: string;
  lastMessageAt: string | null;
};

export type ParticipantInvoiceSummaryItem = {
  id: string;
  invoiceNumber: string | null;
  status: string;
  totalCents: number;
  dueDate: string | null;
};

export type ParticipantSavedProviderItem = {
  id: string;
  providerName: string;
  providerSlug: string | null;
  href: string;
};

export type ParticipantPreferredWorkerItem = {
  id: string;
  workerUserId: string;
  name: string;
  label: string | null;
};

export type ParticipantAccessibilitySummary = {
  mobilityCount: number;
  communicationCount: number;
  hasProfile: boolean;
  summaryText: string;
};

export type ParticipantDashboardData = {
  participantId: string;
  displayName: string;
  viewAsDelegate: boolean;
  upcomingBookings: ParticipantUpcomingBooking[];
  recentMessages: ParticipantMessagePreview[];
  invoicesNeedingAttention: ParticipantInvoiceSummaryItem[];
  savedProviders: ParticipantSavedProviderItem[];
  preferredWorkers: ParticipantPreferredWorkerItem[];
  accessibility: ParticipantAccessibilitySummary;
};
