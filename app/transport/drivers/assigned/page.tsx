import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { checks, stages } from "@/lib/transport/driver-journey";
import {
  assignedRoster,
  driverPilotEnabled,
  isFieldDriver,
} from "@/lib/transport/driver-roster";

import { submitDriverCommand } from "./actions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Assigned trips | MapAble Drivers",
  robots: { index: false, follow: false },
};
const notices: Record<string, string> = {
  saved: "Trip update recorded.",
  review:
    "The assignment or its required confirmations changed. Review the current trip before continuing.",
  invalid: "This request could not be read. Review the current trip.",
  eligibility:
    "This update needs dispatch review. Check driver and vehicle eligibility with your operator.",
  unconfirmed:
    "The update could not be confirmed. Refresh the roster before acting again.",
};
const action =
  "inline-flex min-h-12 items-center rounded-lg bg-[#005B7F] px-4 py-2 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
export default async function AssignedDriverPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const user = await requireAuth();
  const enabled = driverPilotEnabled();
  const allowed = isFieldDriver(user);
  const rows = enabled && allowed ? await assignedRoster(user) : [];
  const { result } = await searchParams;
  return (
    <section className="mx-auto max-w-3xl space-y-5 px-5 py-8 text-[#0C1833]">
      <Link
        href="/transport/drivers"
        className="inline-flex min-h-12 items-center underline"
      >
        Back to MapAble Drivers
      </Link>
      <h1 className="text-3xl font-bold">Assigned trips</h1>
      {result && Object.hasOwn(notices, result) && (
        <p role="status" className="rounded-lg bg-slate-100 p-3">
          {notices[result]}
        </p>
      )}
      {!allowed ? (
        <p>This roster is available to assigned transport drivers.</p>
      ) : !enabled ? (
        <>
          <p>The driver field pilot is closed on this deployment.</p>
          <Link href="/transport/driver" className={action}>
            Open existing driver workspace
          </Link>
        </>
      ) : (
        <>
          <p>
            Upcoming assignments use Sydney time. Use these controls while
            parked. Ask the rider how they want to communicate and what
            assistance they want. Your operator can help with a change, delay or
            unsafe pickup.
          </p>
          {rows.length === 0 && (
            <p role="status">You have no current or upcoming assigned trips.</p>
          )}
          {rows.map((r) => {
            const n = stages.findIndex((s) => s.id === r.status);
            const stage = stages[n];
            if (!stage) return null;
            return (
              <article
                key={r.assignment}
                className="space-y-3 rounded-xl border border-slate-300 p-5"
              >
                <h2 className="text-xl font-bold">
                  {r.from} to {r.to}
                </h2>
                <p>
                  {new Intl.DateTimeFormat("en-AU", {
                    timeZone: "Australia/Sydney",
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(r.scheduled))}{" "}
                  · {r.vehicle} · {stage.label}
                </p>
                {!r.exact && n < stages.length - 1 && (
                  <p className="text-sm">
                    Area-level stops. Confirm the agreed pickup and drop-off
                    with dispatch before travel.
                  </p>
                )}
                {stage.next && (
                  <form action={submitDriverCommand} className="space-y-3">
                    <input
                      type="hidden"
                      name="assignment"
                      value={r.assignment}
                    />
                    <input type="hidden" name="revision" value={r.revision} />
                    <input type="hidden" name="expected" value={r.status} />
                    {(n === 2 || n === 4 || n === 7) && (
                      <fieldset>
                        <legend className="font-semibold">
                          Confirm before continuing
                        </legend>
                        {(n === 2
                          ? checks
                          : [
                              n === 4
                                ? "The rider confirmed readiness and boarded."
                                : "Arrival and the agreed handover are complete.",
                            ]
                        ).map((label, i) => (
                          <label
                            key={label}
                            className="flex min-h-12 items-center gap-3"
                          >
                            <input
                              type="checkbox"
                              required
                              name="confirm"
                              value={
                                n === 2
                                  ? ["vehicle", "plan", "communication"][i]
                                  : "rider"
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </fieldset>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button name="kind" value="advance" className={action}>
                        {stage.next}
                      </button>
                      {n === 0 && (
                        <button
                          className="min-h-12 rounded-lg border border-slate-500 px-4"
                          name="kind"
                          value="decline"
                        >
                          Return offer to dispatch
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </article>
            );
          })}
        </>
      )}
      <Link
        href="/contact"
        className="inline-flex min-h-12 items-center underline"
      >
        Contact MapAble
      </Link>
    </section>
  );
}
