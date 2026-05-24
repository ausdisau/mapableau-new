"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { PlainLanguageStatusBadge } from "@/components/modules/PlainLanguageStatusBadge";
import type { CareBundleView } from "@/types/care";

type LinkedTransportBannerProps = {
  careRequestId: string;
};

export function LinkedTransportBanner({ careRequestId }: LinkedTransportBannerProps) {
  const [bundle, setBundle] = useState<CareBundleView | null>(null);

  useEffect(() => {
    void fetch(`/api/care/requests/${careRequestId}/bundle`)
      .then((r) => r.json())
      .then((d) => setBundle(d))
      .catch(() => setBundle(null));
  }, [careRequestId]);

  if (!bundle?.linkedTransport) return null;

  const t = bundle.linkedTransport;

  return (
    <aside
      className="rounded-xl border border-primary/20 bg-primary/5 p-4"
      aria-labelledby="linked-transport-heading"
    >
      <h2 id="linked-transport-heading" className="font-heading text-lg font-semibold">
        Linked transport
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        This trip is connected to your care request.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PlainLanguageStatusBadge label={t.status} tone="active" />
      </div>
      <p className="mt-2 text-sm">
        {t.pickupAddress} → {t.dropoffAddress}
      </p>
      <Link
        href={`/dashboard/transport/${t.id}`}
        className="mt-3 inline-block text-sm font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        View transport details
      </Link>
    </aside>
  );
}
