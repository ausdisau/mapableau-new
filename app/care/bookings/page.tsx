import { CalendarDays, ClipboardCheck, Plus, Search } from "lucide-react";
import Link from "next/link";

import { BookingJourneyOverview } from "@/components/care/BookingJourneyOverview";
import { CareListCard } from "@/components/care/CareListCard";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const PENDING_REQUEST_STATUSES = [
  "submitted",
  "awaiting_admin_review",
  "awaiting_provider_response",
  "matched",
] as const;

export default async function CareBookingsPage() {
  const user = await requirePermission("care:read:self");
  const [bookings, pendingRequests, recordsNeedingReview] = await Promise.all([
    prisma.careBooking.findMany({
      where: { participantId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        organisation: { select: { name: true } },
        careRequest: { select: { title: true } },
      },
    }),
    prisma.careRequest.findMany({
      where: {
        participantId: user.id,
        status: { in: [...PENDING_REQUEST_STATUSES] },
        careBooking: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        assignedOrganisation: { select: { name: true } },
      },
    }),
    prisma.careServiceLog.count({
      where: { participantId: user.id, status: "submitted" },
    }),
  ]);

  const pendingWithoutBooking = pendingRequests.filter(
    (request) =>
      !bookings.some((booking) => booking.careRequestId === request.id)
  );
  const activeBookings = bookings.filter((booking) =>
    ["pending_provider", "confirmed", "active"].includes(booking.status)
  ).length;

  return (
    <div className="space-y-10">
      <CorePageHeader
        eyebrow="Care booking centre"
        title="Your support, organised around you"
        description="Request support, follow each response and review the record after support is delivered. You decide what is shared and what gets confirmed."
        className="border-0 pb-0"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/care/request">
              <Plus className="h-5 w-5" aria-hidden />
              Request support
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/care/find">
              <Search className="h-5 w-5" aria-hidden />
              Find providers
            </Link>
          </Button>
        </div>
      </CorePageHeader>

      <dl className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/70 shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EAF3FF] text-[#005B7F]">
              <CalendarDays className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <dt className="text-sm text-muted-foreground">Active bookings</dt>
              <dd className="text-2xl font-bold text-[#0C1833]">
                {activeBookings}
              </dd>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E7F6F2] text-[#006A4E]">
              <Search className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <dt className="text-sm text-muted-foreground">Requests in progress</dt>
              <dd className="text-2xl font-bold text-[#0C1833]">
                {pendingWithoutBooking.length}
              </dd>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-none">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF6D6] text-[#795900]">
              <ClipboardCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <dt className="text-sm text-muted-foreground">Records to review</dt>
              <dd className="text-2xl font-bold text-[#0C1833]">
                {recordsNeedingReview}
              </dd>
            </div>
          </CardContent>
        </Card>
      </dl>

      {recordsNeedingReview > 0 ? (
        <section
          aria-labelledby="records-attention-title"
          className="rounded-2xl border-2 border-[#E0B000] bg-[#FFF9E8] p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="max-w-2xl space-y-1">
              <h2
                id="records-attention-title"
                className="font-heading text-xl font-bold text-[#0C1833]"
              >
                A support record needs your review
              </h2>
              <p className="text-sm leading-6 text-slate-700">
                Check what was delivered. You can approve the record or raise a
                concern; approving a record is not an NDIS funding decision.
              </p>
            </div>
            <Button asChild variant="outline" className="bg-white">
              <Link href="/care/service-logs">Review support records</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <BookingJourneyOverview />

      {pendingWithoutBooking.length > 0 ? (
        <section aria-labelledby="requests-title" className="space-y-3">
          <div className="max-w-2xl space-y-1">
            <h2
              id="requests-title"
              className="font-heading text-2xl font-bold text-[#0C1833]"
            >
              Requests in progress
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              A person or service-ready provider reviews each request. You can
              review any proposed provider before the booking is confirmed.
            </p>
          </div>
          <ul className="space-y-3">
            {pendingWithoutBooking.map((request) => (
              <li key={request.id}>
                <CareListCard
                  href={`/dashboard/care/${request.id}`}
                  title={request.title}
                  subtitle={
                    request.assignedOrganisation?.name ??
                    "Provider options are being prepared"
                  }
                  status={request.status}
                  meta="Submitted — no worker is assigned until the required confirmation is complete"
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="bookings-title" className="space-y-3">
        <div className="max-w-2xl space-y-1">
          <h2
            id="bookings-title"
            className="font-heading text-2xl font-bold text-[#0C1833]"
          >
            Your bookings
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Open a booking to check support tasks, access needs and service
            records.
          </p>
        </div>
        {bookings.length > 0 ? (
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <CareListCard
                  href={`/care/bookings/${booking.id}`}
                  title={booking.careRequest.title}
                  subtitle={booking.organisation.name}
                  status={booking.status}
                />
              </li>
            ))}
          </ul>
        ) : pendingWithoutBooking.length === 0 ? (
          <Card className="border-dashed border-border/80 shadow-none">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F6F2] text-[#006A4E]">
                <CalendarDays className="h-6 w-6" aria-hidden />
              </span>
              <div className="max-w-xl space-y-2">
                <h3 className="font-heading text-xl font-bold text-[#0C1833]">
                  No bookings yet
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  Start with a support request or compare providers. You will
                  review a plain-language draft before anything is shared.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline">
                  <Link href="/care/request">Describe what you need</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/care/find">Browse providers</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
