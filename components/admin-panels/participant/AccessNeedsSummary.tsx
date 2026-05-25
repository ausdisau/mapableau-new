import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import type { AccessibilityProfile, ParticipantProfile } from "@prisma/client";

export function AccessNeedsSummary({
  profile,
  accessibility,
}: {
  profile: ParticipantProfile | null;
  accessibility: AccessibilityProfile | null;
}) {
  const mobility = Array.isArray(accessibility?.mobilityNeeds)
    ? (accessibility.mobilityNeeds as string[])
    : [];
  const communication = Array.isArray(accessibility?.communicationPreferences)
    ? (accessibility.communicationPreferences as string[])
    : [];

  return (
    <PanelSection
      title="Access needs summary"
      description="Shared only with providers you consent to."
    >
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-muted-foreground">Display name</dt>
          <dd>{profile?.displayName ?? "Not set"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Mobility</dt>
          <dd>{mobility.length ? mobility.join(", ") : "Not specified"}</dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Communication</dt>
          <dd>
            {communication.length ? communication.join(", ") : "Not specified"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-muted-foreground">Home region</dt>
          <dd>
            {[profile?.homeSuburb, profile?.homeState].filter(Boolean).join(", ") ||
              "Not set"}
          </dd>
        </div>
      </dl>
      <Link
        href="/participant/profile"
        className="mt-4 inline-flex min-h-10 text-sm font-medium text-primary hover:underline"
      >
        Update profile and accessibility →
      </Link>
    </PanelSection>
  );
}
