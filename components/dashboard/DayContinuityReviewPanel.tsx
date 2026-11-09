import Link from "next/link";

import { buildDayContinuityReview } from "@/lib/day/continuity-review";
import type { MyDaySnapshot } from "@/lib/dashboard/my-day-status";

const linkClass =
  "inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#005B7F] underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C] focus-visible:ring-offset-2";

function reviewLabel(status: "pending" | "cancelled" | "unknown") {
  if (status === "cancelled") return "Cancelled — check arrangements";
  if (status === "pending") return "Awaiting confirmation";
  return "Status unknown — check source";
}

export function DayContinuityReviewPanel({
  snapshot,
}: {
  snapshot: MyDaySnapshot;
}) {
  const review = buildDayContinuityReview(snapshot);

  return (
    <section
      aria-labelledby="day-continuity-heading"
      className="space-y-5 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
      data-testid="day-continuity-review"
      data-readiness={review.readiness}
    >
      <header className="space-y-2">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#005B7F]">
          Research-informed preview · read-only
        </p>
        <h2 id="day-continuity-heading" className="font-heading text-xl font-bold text-[#0C1833]">
          Check your day and choose what happens next
        </h2>
        <p className="max-w-3xl text-sm text-slate-700">
          These are statuses from your existing care and transport records,
          including recent disruptions. They are not proof of worker suitability,
          accessible transport, AAC readiness or a fully workable day.
        </p>
      </header>

      <p role="status" className="rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-semibold text-slate-900">
        Whole-day readiness: not assessed. No booking, worker replacement or transport change has been made.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-bold text-[#0C1833]">Items to review</h3>
          {review.issues.length === 0 ? (
            <p className="mt-2 text-sm text-slate-700">
              No pending, cancelled or unknown items were surfaced by these
              records. This does not mean your entire day is verified.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {review.issues.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-bold text-[#0C1833]">{item.title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {reviewLabel(item.sourceStatus)}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{item.certaintyNote}</p>
                  <Link className={linkClass + " mt-3"} href={item.href}>
                    Review source record
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <h3 className="text-base font-bold text-[#0C1833]">What still needs evidence</h3>
          <ul className="mt-3 space-y-3">
            {review.evidenceChecks.map((check) => (
              <li key={check.code}>
                <p className="text-sm font-bold text-slate-900">
                  {check.label} — not assessed
                </p>
                <p className="mt-1 text-sm text-slate-700">{check.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <nav aria-label="Participant-directed next steps">
        <h3 className="text-base font-bold text-[#0C1833]">Your options</h3>
        <p className="mt-1 text-sm text-slate-700">
          Choose a source record to review, check your preferences or use the
          existing help and safety channels. These links do not make bookings or
          automatically contact anyone.
        </p>
        <ul className="mt-3 flex flex-wrap gap-3">
          <li><Link className={linkClass} href="/care/bookings">Review care</Link></li>
          <li><Link className={linkClass} href="/dashboard/transport">Review transport</Link></li>
          <li><Link className={linkClass} href="/dashboard/accessibility">Communication and access preferences</Link></li>
          <li><Link className={linkClass} href="/dashboard/consent">Consent and access</Link></li>
          <li><Link className={linkClass} href="/dashboard/safety">Help and safety</Link></li>
        </ul>
      </nav>
      <p className="text-xs text-slate-600">
        Source: authenticated, participant-scoped programmatic records. Snapshot:
        {" "}{new Date(review.generatedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })} (Sydney).
        This view does not invoke AI, change consent, send messages, make payments, or modify services.
      </p>
    </section>
  );
}
