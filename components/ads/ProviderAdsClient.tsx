"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

type Advertiser = {
  id: string;
  organisationId: string;
  category: string;
  onboardingStatus: string;
  organisation: { name: string; verificationStatus: string };
  campaigns: { id: string; name: string; status: string }[];
};

const CATEGORY_LABELS: Record<string, string> = {
  ndis_provider: "NDIS provider",
  allied_health: "Allied health",
  support_coordinator: "Support coordinator",
  plan_manager: "Plan manager",
  accessible_transport: "Accessible transport",
  assistive_technology: "Assistive technology",
  inclusive_employer: "Inclusive employer",
  accessible_tourism: "Accessible tourism",
  disability_education: "Disability education / training",
  council_public_interest: "Council / public interest",
};

export function ProviderAdsClient({
  organisationId,
}: {
  organisationId: string;
}) {
  const [advertiser, setAdvertiser] = useState<Advertiser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/ads/advertiser?organisationId=${organisationId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setAdvertiser(data.advertiser);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-muted-foreground">Loading ads manager…</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (!advertiser) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Get started with MapAble Ads</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Self-serve advertising for verified disability-sector organisations.
          Contextual targeting only — never participant-sensitive data.
        </p>
        <Button asChild variant="default" size="default" className="mt-4">
          <Link href={`/provider/ads/onboarding?org=${organisationId}`}>
            Start advertiser onboarding
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{advertiser.organisation.name}</h2>
            <p className="text-sm text-muted-foreground">
              {CATEGORY_LABELS[advertiser.category] ?? advertiser.category}
            </p>
          </div>
          <StatusBadge status={advertiser.onboardingStatus} />
        </div>
        {advertiser.onboardingStatus !== "active" ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Complete verification to activate advertising.
          </p>
        ) : (
          <Button asChild variant="default" size="default" className="mt-4">
            <Link href={`/provider/ads/campaigns/new?org=${organisationId}`}>
              Create campaign
            </Link>
          </Button>
        )}
      </Card>

      <section>
        <h3 className="mb-3 font-semibold">Campaigns</h3>
        {advertiser.campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaigns yet.</p>
        ) : (
          <ul className="space-y-2">
            {advertiser.campaigns.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/provider/ads/campaigns/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 hover:border-primary/30"
                >
                  <span className="font-medium">{c.name}</span>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
