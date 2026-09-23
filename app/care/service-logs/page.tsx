import { ClipboardCheck, CalendarDays } from "lucide-react";
import Link from "next/link";

import { ServiceLogConfirmDispute } from "@/components/care/ServiceLogConfirmDispute";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { requirePermission } from "@/lib/auth/guards";
import { listServiceLogsForUser } from "@/lib/care/care-service-log-service";

function formatDateTime(value: Date | null | undefined) {
  if (!value) return "Date not recorded";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function supportSummary(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) {
    return "The delivered supports have not been itemised yet.";
  }
  const names = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "name" in item) {
        const name = item.name;
        return typeof name === "string" ? name : null;
      }
      return null;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 3);

  return names.length > 0
    ? names.join(", ")
    : "Support details are available in this record.";
}

export default async function CareServiceLogsPage() {
  const user = await requirePermission("care:read:self");
  const logs = await listServiceLogsForUser(user);
  const recordsToReview = logs.filter((log) => log.status === "submitted").length;

  return (
    <div className="space-y-8">
      <CorePageHeader
        eyebrow="Support records"
        title="Your support records"
        description="Review completed support in plain language. Approve an accurate record or raise a concern for a person to review."
        className="border-0 pb-0"
      >
        <Button asChild variant="outline">
          <Link href="/care/bookings">Back to bookings</Link>
        </Button>
      </CorePageHeader>

      {recordsToReview > 0 ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-[#E0B000] bg-[#FFF9E8] p-4 text-sm text-[#5B4500]"
        >
          <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>
            <strong>
              {recordsToReview} {recordsToReview === 1 ? "record" : "records"}{" "}
              waiting for your review.
            </strong>{" "}
            Approving a record confirms what was delivered; it is not a funding
            or payment decision.
          </p>
        </div>
      ) : null}

      {logs.length > 0 ? (
        <ul className="space-y-4" aria-label="Support records">
          {logs.map((log) => (
            <li key={log.id}>
              <Card className="border-border/70 shadow-none">
                <CardHeader className="gap-3 pb-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <CardTitle className="font-heading text-xl text-[#0C1833]">
                        {log.careBooking.careRequest.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {log.careBooking.organisation.name} ·{" "}
                        {formatDateTime(log.careShift?.startAt ?? log.submittedAt)}
                      </p>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <dl className="grid gap-4 rounded-xl bg-muted/30 p-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-[#0C1833]">
                        Supports recorded
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                        {supportSummary(log.supportsDelivered)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-[#0C1833]">
                        Time recorded
                      </dt>
                      <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                        {log.durationMinutes
                          ? `${log.durationMinutes} minutes`
                          : log.careShift?.endAt
                            ? `Ended ${formatDateTime(log.careShift.endAt)}`
                            : "Duration not recorded"}
                      </dd>
                    </div>
                  </dl>

                  {log.notes ? (
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-[#0C1833]">
                        Notes
                      </h3>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {log.notes}
                      </p>
                    </div>
                  ) : null}

                  {user.primaryRole === "participant" ? (
                    <ServiceLogConfirmDispute
                      logId={log.id}
                      careShiftId={log.careShift?.id}
                      status={log.status}
                      organisationId={log.organisationId}
                    />
                  ) : null}

                  <Link
                    href={`/care/bookings/${log.careBookingId}`}
                    className="inline-flex min-h-11 items-center text-sm font-semibold text-[#005B7F] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    View booking details
                  </Link>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <Card className="border-dashed border-border/80 shadow-none">
          <CardContent className="flex min-h-[20rem] flex-col items-start justify-center gap-5 p-6 sm:p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F6F2] text-[#006A4E]">
              <CalendarDays className="h-6 w-6" aria-hidden />
            </span>
            <div className="max-w-xl space-y-2">
              <h2 className="font-heading text-2xl font-bold text-[#0C1833]">
                No support records yet
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                A record will appear here after a worker submits completed
                support. You will then be able to approve it or raise a concern.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline">
                <Link href="/care/bookings">View your bookings</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/care/request">Request support</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
