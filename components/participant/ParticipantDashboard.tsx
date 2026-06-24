import React from "react";

import { AccessibilityProfileSummary } from "@/components/participant/AccessibilityProfileSummary";
import { ParticipantInvoiceSummary } from "@/components/participant/ParticipantInvoiceSummary";
import { PreferredWorkersPanel } from "@/components/participant/PreferredWorkersPanel";
import { QuickActionsPanel } from "@/components/participant/QuickActionsPanel";
import { RecentMessagesPanel } from "@/components/participant/RecentMessagesPanel";
import { SavedProvidersPanel } from "@/components/participant/SavedProvidersPanel";
import { UpcomingSupportCard } from "@/components/participant/UpcomingSupportCard";
import type { ParticipantDashboardData } from "@/types/participant-dashboard";

type ParticipantDashboardProps = {
  data: ParticipantDashboardData;
};

export function ParticipantDashboard({ data }: ParticipantDashboardProps) {
  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
          {data.viewAsDelegate
            ? `${data.displayName}'s dashboard`
            : `Hello, ${data.displayName}`}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {data.viewAsDelegate
            ? "You are viewing this dashboard with consent as a nominee or support coordinator. Only share information the participant has approved."
            : "Your bookings, messages, invoices and accessibility settings in one place. You control what providers see."}
        </p>
      </header>

      <QuickActionsPanel />

      <div className="grid gap-10 lg:grid-cols-2">
        <UpcomingSupportCard bookings={data.upcomingBookings} />
        <RecentMessagesPanel messages={data.recentMessages} />
        <ParticipantInvoiceSummary invoices={data.invoicesNeedingAttention} />
        <AccessibilityProfileSummary summary={data.accessibility} />
        <SavedProvidersPanel providers={data.savedProviders} />
        <PreferredWorkersPanel workers={data.preferredWorkers} />
      </div>
    </div>
  );
}
