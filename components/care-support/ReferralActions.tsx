"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { SupportReferral } from "@prisma/client";

function providerFinderUrl(destinationJson: unknown): string | null {
  if (!destinationJson || typeof destinationJson !== "object" || Array.isArray(destinationJson)) {
    return null;
  }
  const d = destinationJson as Record<string, unknown>;
  const params = new URLSearchParams();
  if (typeof d.q === "string") params.set("q", d.q);
  if (typeof d.suburb === "string") params.set("suburb", d.suburb);
  if (typeof d.state === "string") params.set("state", d.state);
  const qs = params.toString();
  return qs ? `/provider-finder?${qs}` : "/provider-finder";
}

export function ReferralActions({ referral }: { referral: SupportReferral }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerUrl =
    referral.referralType === "internal_provider"
      ? providerFinderUrl(referral.destinationJson)
      : null;

  return (
    <div className="flex flex-wrap gap-2">
      {error ? (
        <p role="alert" className="w-full text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {referral.referralType === "internal_care" && !referral.careRequestId ? (
        <Button
          type="button"
          variant="default"
          size="default"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            const res = await fetch(
              `/api/care-support/referrals/${referral.id}/create-care-request`,
              { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
            );
            setLoading(false);
            if (!res.ok) {
              setError("Could not create care request");
              return;
            }
            const d = await res.json();
            router.push(`/care/request?careRequestId=${d.careRequest?.id ?? ""}`);
          }}
        >
          Create care request
        </Button>
      ) : null}
      {referral.careRequestId ? (
        <Link href={`/care/bookings`} className="text-sm text-primary underline">
          View care flow
        </Link>
      ) : null}
      {providerUrl ? (
        <Link href={providerUrl} className="inline-flex">
          <Button type="button" variant="outline" size="default">
            Open provider finder
          </Button>
        </Link>
      ) : null}
      {referral.referralType === "internal_transport" ? (
        <Link href="/dashboard/transport" className="text-sm text-primary underline">
          Request transport
        </Link>
      ) : null}
    </div>
  );
}
