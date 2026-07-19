import Link from "next/link";

import { AccessPassport } from "@/components/access-passport/AccessPassport";
import { parseAccessShareSettings } from "@/lib/access-passport/share-settings";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Access Passport | MapAble",
  description:
    "Manage private display settings and shareable access requirements with explicit consent.",
};

export default async function AccessPassportPage() {
  const user = await requireAuth();
  const profile = await prisma.accessibilityProfile.findUnique({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-bold text-[#005B7F]">
          <Link href="/dashboard/accessibility" className="underline mapable-focus">
            Accessibility
          </Link>
        </p>
        <h1 className="font-heading text-3xl font-black text-[#0C1833]">
          Personal Access Passport
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Keep interface preferences private. Share only the access requirements
          you choose, with a clear purpose and end date. MapAble does not infer a
          diagnosis from these settings.
        </p>
      </header>
      <AccessPassport
        initialProfile={{
          mobilityNeeds: (profile?.mobilityNeeds as string[]) ?? [],
          communicationPreferences:
            (profile?.communicationPreferences as string[]) ?? [],
          sensoryPreferences:
            (profile?.sensoryPreferences as Record<string, unknown>) ?? {},
          cognitivePreferences:
            (profile?.cognitivePreferences as Record<string, unknown>) ?? {},
          transportRequirements:
            (profile?.transportRequirements as Record<string, unknown>) ?? {},
        }}
        initialShareSettings={parseAccessShareSettings(profile?.shareWithProviders)}
      />
    </div>
  );
}
