"use client";

import { useEffect, useState } from "react";

import { accessibilityReviewsV1Enabled } from "@/lib/config/accessibility-reviews";

type ContributionPayload = {
  contribution: {
    totalPoints: number;
    level: string;
    recent: {
      id: string;
      contributionType: string;
      points: number;
      reasonCode: string;
      awardedAt: string;
    }[];
    privacy: {
      hidePointsPublicly: boolean;
      hideBadgesPublicly: boolean;
    };
  };
  badges: {
    hideBadgesPublicly: boolean;
    badges: {
      key: string;
      title: string;
      description: string;
      category: string;
      awardedAt: string;
    }[];
  };
  challenges: {
    id: string;
    title: string;
    plainLanguageDescription: string;
    progressCount: number;
    targetCount: number;
    completed: boolean;
  }[];
};

export function ContributionProfileSection() {
  const [data, setData] = useState<ContributionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessibilityReviewsV1Enabled) return;
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/account/contribution-ledger");
      if (!res.ok) {
        if (!cancelled) setError("Could not load contribution history");
        return;
      }
      const json = await res.json();
      if (!cancelled) setData(json);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!accessibilityReviewsV1Enabled) return null;
  if (error) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    );
  }
  if (!data) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading contribution points…
      </p>
    );
  }

  async function savePrivacy(patch: {
    hidePointsPublicly?: boolean;
    hideBadgesPublicly?: boolean;
  }) {
    await fetch("/api/account/contribution-ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const res = await fetch("/api/account/contribution-ledger");
    if (res.ok) setData(await res.json());
  }

  return (
    <section aria-labelledby="contribution-points-heading" className="space-y-4">
      <h2 id="contribution-points-heading" className="text-lg font-semibold">
        Contribution points
      </h2>
      <p className="text-sm text-muted-foreground">
        Points reward useful accessibility information. They do not change
        ratings, accreditation, or search placement.
      </p>
      <p className="text-sm">
        Total valid contribution points: {data.contribution.totalPoints}. Level:{" "}
        {data.contribution.level}.
      </p>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Privacy controls</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.contribution.privacy.hidePointsPublicly}
            onChange={(e) =>
              void savePrivacy({ hidePointsPublicly: e.target.checked })
            }
          />
          Hide contribution totals from public view
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.contribution.privacy.hideBadgesPublicly}
            onChange={(e) =>
              void savePrivacy({ hideBadgesPublicly: e.target.checked })
            }
          />
          Hide badges from public view
        </label>
      </fieldset>

      <div>
        <h3 className="font-medium">Badges</h3>
        {data.badges.badges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No badges yet.</p>
        ) : (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {data.badges.badges.map((b) => (
              <li key={b.key}>
                {b.title} — {b.description}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-medium">Recent accepted contributions</h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {data.contribution.recent.map((r) => (
            <li key={r.id}>
              {r.contributionType.replace(/_/g, " ")} (+{r.points}) —{" "}
              {new Date(r.awardedAt).toLocaleDateString("en-AU")}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium">Mapping challenges</h3>
        {data.challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No active mapping challenges.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {data.challenges.map((c) => (
              <li key={c.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{c.title}</p>
                <p className="text-muted-foreground">
                  {c.plainLanguageDescription}
                </p>
                <p>
                  Progress: {c.progressCount}
                  {c.targetCount > 0 ? ` / ${c.targetCount}` : ""}
                  {c.completed ? " — completed" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
