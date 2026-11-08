import Link from "next/link";

import { MapAbleIDScreen } from "@/components/identity/MapAbleIDScreen";
import { requireAuth } from "@/lib/auth/guards";
import { mapableIdConfig } from "@/lib/config/mapable-id";
import { resolveNextAuthSubject } from "@/lib/identity/adapters/mapable-nextauth-adapter";
import { buildIdentityMeSnapshot } from "@/lib/identity/mapable-id-service";

export const metadata = { title: "MapAbleID | Identity & access" };
export const dynamic = "force-dynamic";

export default async function MapAbleIdentityPage() {
  const user = await requireAuth();

  if (!mapableIdConfig.dashboardEnabled) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">MapAbleID</h1>
        <p className="text-muted-foreground">
          The MapAbleID identity dashboard is not enabled in this environment.
          Existing sign-in and account security pages remain available.
        </p>
        <p>
          <Link
            href="/account/security"
            className="font-medium text-primary hover:underline"
          >
            Open account security
          </Link>
        </p>
      </div>
    );
  }

  const subject = await resolveNextAuthSubject();
  if (!subject || subject.subjectId !== user.id) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">MapAbleID</h1>
        <p className="text-muted-foreground">
          We could not verify your session for the identity dashboard. Please
          sign in again, or use account security for independent recovery.
        </p>
        <p>
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  const snapshot = await buildIdentityMeSnapshot({
    userId: user.id,
    displayName: user.name,
    primaryRole: user.primaryRole ?? null,
    sessionId: subject.sessionId,
    expiresAtMs: subject.expiresAtMs,
  });

  return (
    <div className="p-2 sm:p-4">
      <MapAbleIDScreen snapshot={snapshot} />
    </div>
  );
}
