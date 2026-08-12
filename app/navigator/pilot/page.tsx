import type { Metadata } from "next";
import Link from "next/link";

import { NavigatorPilotJourney } from "@/components/navigator/NavigatorPilotJourney";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isNavigatorPilotEnabled } from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Navigator pilot — guided search",
  description:
    "Participant-controlled MapAble Navigator pilot: goal, confirmation, hard constraints, shortlist, and draft transfer. No booking or payment.",
};

type PageProps = {
  searchParams?: Promise<{ tenantId?: string }>;
};

export default async function NavigatorPilotPage({ searchParams }: PageProps) {
  const enabled = isNavigatorPilotEnabled();
  const params = searchParams ? await searchParams : {};
  const user = enabled ? await getCurrentUser() : null;

  let tenantId: string | null = params.tenantId?.trim() || null;
  if (enabled && user && !tenantId) {
    const membership = await prisma.tenantMembership.findFirst({
      where: { userId: user.id },
      select: { tenantId: true },
      orderBy: { createdAt: "asc" },
    });
    tenantId = membership?.tenantId ?? null;
  }

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[linear-gradient(180deg,#F3F7FA_0%,#E7EEF3_100%)] px-4 py-10 text-[#0C1833]"
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-3">
          <p className="text-sm font-semibold tracking-wide text-[#1B4F72]">
            MapAble
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Navigator pilot
          </h1>
          <p className="max-w-prose text-base leading-relaxed text-[#334155]">
            A quiet place to state a goal, confirm what we understood, keep
            non-negotiables, and review a shortlist. No booking or payment
            happens here.
          </p>
        </header>

        {!enabled ? (
          <section
            aria-labelledby="pilot-disabled-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-disabled-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Navigator pilot is not enabled
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              This governed pilot surface is turned off in this environment. You
              can still find providers using the classic Provider Finder — no AI
              assistance required.
            </p>
            <p className="mt-4">
              <Link
                href="/provider-finder"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Continue to Provider Finder
              </Link>
            </p>
          </section>
        ) : !user ? (
          <section
            aria-labelledby="pilot-signin-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-signin-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Sign in to continue
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              The Navigator pilot needs your account so consent and decisions
              stay under your control.
            </p>
            <p className="mt-4">
              <Link
                href="/api/auth/signin"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#1B4F72] px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Sign in
              </Link>
            </p>
          </section>
        ) : !tenantId ? (
          <section
            aria-labelledby="pilot-tenant-heading"
            className="rounded-lg border border-[#C5D5E0] bg-white p-6"
          >
            <h2
              id="pilot-tenant-heading"
              className="text-lg font-semibold text-[#0C1833]"
            >
              Tenant context required
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#334155]">
              No tenant membership was found for your account. Open this page
              with a{" "}
              <code className="rounded bg-[#F1F5F9] px-1">?tenantId=</code>{" "}
              query when authorised for a synthetic pilot, or ask an
              administrator to add a membership.
            </p>
            <p className="mt-4">
              <Link
                href="/provider-finder"
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#1B4F72] bg-white px-4 py-2 text-sm font-medium text-[#0C1833] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B4F72]"
              >
                Continue to Provider Finder
              </Link>
            </p>
          </section>
        ) : (
          <NavigatorPilotJourney tenantId={tenantId} participantId={user.id} />
        )}
      </div>
    </main>
  );
}
