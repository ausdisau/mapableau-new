import { endOfDay, startOfDay } from "date-fns";
import Link from "next/link";

import { WorkerShiftOffers } from "@/components/care/WorkerShiftOffers";
import {
  OneActionCentre,
  OneEmptyState,
  OnePrivacyNote,
  OneStatus,
} from "@/components/mapable-one";
import { requirePermission } from "@/lib/auth/guards";
import { workerProfileForUser } from "@/lib/care/access-control";
import { isMapAbleOneUnifiedShellEnabled } from "@/lib/config/mapable-one-shell";
import { buildWorkerActionCentre } from "@/lib/mapable-one/action-centre";
import { prisma } from "@/lib/prisma";

export default async function WorkerTodayPage() {
  const user = await requirePermission("care:shift:work");
  const profile = await workerProfileForUser(user.id);
  const oneShell = isMapAbleOneUnifiedShellEnabled();

  if (!profile) {
    return (
      <div className="space-y-4" data-mapable-one={oneShell ? "on" : "off"}>
        {oneShell ? (
          <OneEmptyState
            title="No worker profile linked"
            description="Contact your provider admin to link an active WorkerProfile. Multi-affiliation selection ships in a later gated PR."
          />
        ) : (
          <p className="text-muted-foreground">
            No worker profile linked to your account. Contact your provider admin.
          </p>
        )}
      </div>
    );
  }

  const now = new Date();
  const [shifts, offers] = await Promise.all([
    prisma.careShift.findMany({
      where: {
        workerProfileId: profile.id,
        startAt: { gte: startOfDay(now), lte: endOfDay(now) },
      },
      orderBy: { startAt: "asc" },
      include: { careRequest: { select: { title: true } } },
    }),
    prisma.shiftOffer.findMany({
      where: {
        workerProfileId: profile.id,
        status: "awaiting_worker",
        expiresAt: { gt: now },
      },
      include: {
        careShift: {
          select: {
            startAt: true,
            careRequest: { select: { title: true } },
          },
        },
      },
      orderBy: { expiresAt: "asc" },
    }),
  ]);

  const actionCentre = oneShell
    ? buildWorkerActionCentre({
        profileLinked: true,
        todayShiftCount: shifts.length,
        awaitingOfferCount: offers.length,
      })
    : null;

  return (
    <div className="space-y-4" data-mapable-one={oneShell ? "on" : "off"}>
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Today&apos;s shifts</h1>
        {oneShell ? (
          <p className="text-sm text-muted-foreground">
            Affiliation: first active worker profile for this account. Explicit
            multi-provider selection is planned for PR B — other tenants&apos;
            participants are never shown here.
          </p>
        ) : null}
      </header>

      {actionCentre ? <OneActionCentre projection={actionCentre} /> : null}

      {oneShell ? (
        <OnePrivacyNote>
          Only shifts and offers assigned to your linked worker profile appear.
          Support briefs and progress notes stay behind a separate pilot flag.
        </OnePrivacyNote>
      ) : null}

      <ul className="space-y-3">
        {shifts.map((s) => (
          <li key={s.id}>
            <Link
              href={`/worker/shifts/${s.id}`}
              className={
                oneShell
                  ? "mo-card block p-4"
                  : "block rounded-xl border p-4"
              }
            >
              <span className="font-medium">{s.careRequest.title}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {s.startAt.toLocaleTimeString()}
                {oneShell ? (
                  <OneStatus tone="info" label={String(s.status)} />
                ) : (
                  <span>— {s.status}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
        {shifts.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            {oneShell ? (
              <OneEmptyState
                title="No shifts scheduled today"
                description="Open offers (if any) appear below. Schedule may be flag-gated for your organisation."
                actionHref="/worker/schedule"
                actionLabel="View schedule"
              />
            ) : (
              "No shifts scheduled today."
            )}
          </li>
        ) : null}
      </ul>
      <WorkerShiftOffers
        offers={offers.map((offer) => ({
          id: offer.id,
          title: offer.careShift.careRequest.title,
          startsAt: offer.careShift.startAt.toISOString(),
          expiresAt: offer.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
