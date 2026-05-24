"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AbnLookupField } from "@/components/verification/AbnLookupField";

export function ProviderOnboardingClient({
  organisationId,
  initialAbn,
}: {
  organisationId: string | null;
  initialAbn?: string | null;
}) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {organisationId ? (
        <AbnLookupField
          organisationId={organisationId}
          initialAbn={initialAbn}
          onSaved={() => router.refresh()}
        />
      ) : (
        <p className="text-sm text-muted-foreground rounded-lg border border-border p-4">
          Link your account to an organisation to verify your ABN here, or use{" "}
          <Link href="/dashboard/verification" className="text-primary hover:underline">
            Verification in your dashboard
          </Link>{" "}
          once your organisation membership is active.
        </p>
      )}
      <Link
        href="/dashboard/verification"
        className="inline-block text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        Open full verification dashboard →
      </Link>
    </div>
  );
}
