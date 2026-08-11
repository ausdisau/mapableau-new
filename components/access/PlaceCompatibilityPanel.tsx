"use client";

import { useEffect, useState } from "react";

import { ReportPlaceIssueButton } from "@/components/access/ReportPlaceIssueButton";

type CompatibilityPayload = {
  state: "compatible" | "compatible_with_adjustment" | "uncertain" | "incompatible";
  required: { met: string[]; unmet: string[]; uncertain: string[] };
  preferences: { met: string[]; unmet: string[]; uncertain: string[] };
  adjustments: Array<{ id: string; summary: string }>;
  evidenceRefs: string[];
  limitations: string[];
  participantDecisionRequired: boolean;
  decisionOwner: "PARTICIPANT";
  evaluatedAt: string;
};

const STATE_LABEL: Record<CompatibilityPayload["state"], string> = {
  compatible: "Looks compatible with your stated needs",
  compatible_with_adjustment: "May work with an adjustment",
  uncertain: "We do not know enough yet",
  incompatible: "Known mismatch with a required need",
};

function ConceptList({
  title,
  items,
  empty,
}: {
  title: string;
  items: string[];
  empty: string;
}) {
  return (
    <section aria-label={title} className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function PlaceCompatibilityPanel({ placeId }: { placeId: string }) {
  const [compat, setCompat] = useState<CompatibilityPayload | null>(null);
  const [capabilitiesNote, setCapabilitiesNote] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError("");
      try {
        const [capRes, compatRes] = await Promise.all([
          fetch(`/api/access-infrastructure/places/${placeId}/capabilities`),
          fetch("/api/access-infrastructure/compatibility", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              schemaVersion: "1.0",
              entityType: "place",
              entityId: placeId,
              context: {},
            }),
          }),
        ]);

        if (cancelled) return;

        if (capRes.ok) {
          const capData = await capRes.json();
          const last = (capData.observations as Array<{ observedAt: string }> | undefined)
            ?.map((o) => o.observedAt)
            .sort()
            .at(-1);
          setCapabilitiesNote(
            last
              ? `Last checked evidence: ${new Date(last).toLocaleDateString()}`
              : "No dated evidence on file yet.",
          );
        }

        if (compatRes.status === 401) {
          setError("Sign in and set My Access to see a personalised result.");
          setCompat(null);
          return;
        }
        if (compatRes.status === 404) {
          setError("");
          setCompat(null);
          return;
        }
        if (!compatRes.ok) {
          setError("Could not load compatibility for this place.");
          return;
        }
        const data = await compatRes.json();
        setCompat(data.compatibility as CompatibilityPayload);
      } catch {
        if (!cancelled) setError("Could not load access compatibility.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading access compatibility…
      </p>
    );
  }

  if (!compat) {
    if (!error && !capabilitiesNote) return null;
    return (
      <section
        aria-labelledby="place-compat-heading"
        className="space-y-3 rounded-xl border border-border bg-card p-4"
      >
        <h2 id="place-compat-heading" className="text-lg font-semibold">
          Access for you
        </h2>
        {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
        {capabilitiesNote ? (
          <p className="text-sm text-muted-foreground">{capabilitiesNote}</p>
        ) : null}
        <p className="text-sm">
          <a href="/my-access" className="text-primary underline">
            Manage My Access
          </a>{" "}
          to see what works for you here.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="place-compat-heading"
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <header className="space-y-1">
        <h2 id="place-compat-heading" className="text-lg font-semibold">
          Access for you
        </h2>
        <p className="text-sm font-medium">{STATE_LABEL[compat.state]}</p>
        <p className="text-xs text-muted-foreground">
          Decision owner: {compat.decisionOwner}. MapAble proposes; you decide.
        </p>
      </header>

      <ConceptList
        title="What works for you"
        items={[...compat.required.met, ...compat.preferences.met]}
        empty="No confirmed matches yet."
      />
      <ConceptList
        title="What may need adjustment"
        items={compat.adjustments.map((a) => a.summary)}
        empty="No listed adjustments for your unmet needs."
      />
      <ConceptList
        title="What we don't know"
        items={[...compat.required.uncertain, ...compat.preferences.uncertain]}
        empty="No open unknowns for your stated needs."
      />
      <ConceptList
        title="Known mismatches"
        items={compat.required.unmet}
        empty="No known required mismatches."
      />

      <section aria-label="Evidence" className="space-y-1">
        <h3 className="text-sm font-semibold">Evidence</h3>
        <p className="text-sm text-muted-foreground">
          {compat.evidenceRefs.length
            ? `${compat.evidenceRefs.length} evidence reference(s) used.`
            : "No evidence references linked yet."}
        </p>
        {capabilitiesNote ? (
          <p className="text-sm text-muted-foreground">{capabilitiesNote}</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Evaluated {new Date(compat.evaluatedAt).toLocaleString()}
        </p>
      </section>

      {compat.limitations.length > 0 ? (
        <ConceptList
          title="Alternatives & limitations"
          items={compat.limitations}
          empty=""
        />
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <ReportPlaceIssueButton placeId={placeId} />
        <a href="/my-access" className="text-sm text-primary underline">
          Edit My Access
        </a>
        <a href="/access/places" className="text-sm text-primary underline">
          Browse places list (non-map)
        </a>
      </div>
    </section>
  );
}
