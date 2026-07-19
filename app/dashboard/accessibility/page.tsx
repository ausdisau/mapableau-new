import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Accessibility | MapAble Core" };

export default async function AccessibilityPage() {
  const user = await requireAuth();
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  const mobility = (profile?.mobilityNeeds as string[]) ?? [];
  const communication =
    (profile?.communicationPreferences as string[]) ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Accessibility preferences
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Your access needs are reused across care, transport and other MapAble
          services. Providers only see what you consent to share.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium">
          <Link
            href="/dashboard/access-passport"
            className="text-primary underline-offset-4 hover:underline mapable-focus"
          >
            Open Access Passport →
          </Link>
          <Link
            href="/dashboard/accessibility/edit"
            className="text-primary underline-offset-4 hover:underline mapable-focus"
          >
            Edit preferences →
          </Link>
        </div>
      </header>

      <dl className="grid max-w-xl gap-4 rounded-xl border border-border bg-card p-4 text-sm">
        <div>
          <dt className="font-medium">Mobility</dt>
          <dd>{mobility.length ? mobility.join(", ") : "Not set"}</dd>
        </div>
        <div>
          <dt className="font-medium">Communication</dt>
          <dd>
            {communication.length ? communication.join(", ") : "Not set"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
