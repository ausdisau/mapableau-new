import type { Metadata } from "next";

import Link from "next/link";

import CommunityLiveApp from "@/components/community-live/CommunityLiveApp";
import SignalSitesApp from "@/components/signal-sites/SignalSitesApp";
import { getCurrentUser } from "@/lib/auth/current-user";
import { evaluateCommunityPilotAccess } from "@/lib/community-live/policy";
import { communityLiveEnabled, communityPilotModeEnabled } from "@/lib/community-live/runtime";

export const metadata: Metadata = {
  title: "MapAble Community | Mapping Challenges",
  description:
    "Participant-led Community Mapping Challenges. Observations are scoped reports, not independent accessibility verification or legal certification.",
};

export const dynamic = "force-dynamic";

/**
 * Production remains browser-local when the live feature is off.
 * A protected preview requires a valid NextAuth account and a server-side user ID allowlist.
 */
export default async function CommunitySignalSitesPage() {
  if (!communityLiveEnabled()) return <SignalSitesApp />;
  if (communityPilotModeEnabled()) {
    let user = null;
    try {
      user = await getCurrentUser();
    } catch {
      // An unavailable session or database must never grant pilot access.
    }
    const decision = evaluateCommunityPilotAccess({
      pilotMode: true,
      userId: user?.id,
      allowedIds: process.env.MAPABLE_COMMUNITY_PILOT_USER_IDS ?? "",
    });
    if (decision !== "allowed") {
      return (
        <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
          <div role="note" className="rounded-2xl border-2 border-amber-500 bg-amber-50 p-6 text-slate-900">
            <h1 className="text-3xl font-black">Protected MapAble Community pilot</h1>
            <p className="mt-4 leading-7">
              This workspace uses an invited group of test accounts. No public
              community submissions are enabled here.
            </p>
            {decision === "sign_in_required" ? (
              <p className="mt-3 leading-7">
                <Link className="font-bold underline underline-offset-4" href="/login?callbackUrl=%2Fcommunity">
                  Sign in with your invited MapAble account
                </Link>
                . If you cannot access your account, contact MapAble support.
              </p>
            ) : (
              <p className="mt-3 leading-7" role="status">
                This account does not currently have permission to participate in
                the protected pilot. Contact MapAble support to request access.
              </p>
            )}
          </div>
        </main>
      );
    }
  }
  return <CommunityLiveApp />;
}
