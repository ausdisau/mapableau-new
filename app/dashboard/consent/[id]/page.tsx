"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConsentScopeCard } from "@/components/consent/ConsentScopeCard";
import { Button } from "@/components/ui/button";

type ConsentDetail = {
  id: string;
  scope: string;
  purpose: string;
  status: string;
  recipientType?: string | null;
  dataScope?: unknown;
  grantedToOrganisation?: { name: string } | null;
  grantedToUser?: { name: string | null } | null;
  shareMode?: string | null;
  expiryDate?: string | null;
};

function recipientName(consent: ConsentDetail) {
  if (consent.grantedToOrganisation?.name) {
    return consent.grantedToOrganisation.name;
  }
  if (consent.grantedToUser?.name) {
    return consent.grantedToUser.name;
  }
  if (consent.recipientType) {
    return consent.recipientType.replace(/_/g, " ");
  }
  return "Not specified — no ambient supporter access";
}

function fieldsList(consent: ConsentDetail): string[] {
  if (Array.isArray(consent.dataScope) && consent.dataScope.length > 0) {
    return consent.dataScope.map((f) => String(f).replace(/[._]/g, " "));
  }
  return [consent.scope.replace(/[._]/g, " ")];
}

export default function ConsentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentDetail | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/consents")
      .then((r) => r.json())
      .then((data) => {
        const found = data.consents?.find(
          (c: { id: string }) => c.id === id
        ) as ConsentDetail | undefined;
        if (found) {
          setConsent(found);
        }
      })
      .catch(() => setError("Could not load consent"));
  }, [id]);

  if (error) {
    return (
      <p className="text-destructive" role="alert">
        {error}
      </p>
    );
  }

  if (!consent) {
    return <p>Loading consent…</p>;
  }

  const fields = fieldsList(consent);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <Link
        href="/dashboard/consent"
        className="inline-flex min-h-11 items-center text-sm text-primary hover:underline"
      >
        ← Back to consent
      </Link>

      <header>
        <h1 className="font-heading text-2xl font-bold">Consent details</h1>
        <p className="mt-2 text-muted-foreground">
          Purpose, recipient, and fields for this grant. Revoke stops future
          sharing; the revoke is audited.
        </p>
      </header>

      <ConsentScopeCard
        scope={consent.scope}
        purpose={consent.purpose}
        status={consent.status}
        grantedToName={recipientName(consent)}
      />

      <section
        aria-labelledby="fields-heading"
        className="rounded-xl border border-border bg-card p-4"
      >
        <h2 id="fields-heading" className="font-semibold">
          Fields in scope
        </h2>
        <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
          {fields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
        {consent.shareMode ? (
          <p className="mt-3 text-sm">
            <span className="font-medium">Share mode: </span>
            {consent.shareMode.replace(/_/g, " ")}
          </p>
        ) : null}
        {consent.expiryDate ? (
          <p className="mt-1 text-sm">
            <span className="font-medium">Expires: </span>
            {new Date(consent.expiryDate).toLocaleDateString("en-AU")}
          </p>
        ) : null}
      </section>

      {consent.status === "active" ? (
        <Button
          type="button"
          variant="destructive"
          size="default"
          className="min-h-11"
          disabled={revoking}
          onClick={async () => {
            setRevoking(true);
            setError(null);
            const res = await fetch(`/api/consents/${id}/revoke`, {
              method: "POST",
            });
            if (!res.ok) {
              setError("Revoke failed — try again");
              setRevoking(false);
              return;
            }
            router.push("/dashboard/consent");
            router.refresh();
          }}
        >
          {revoking ? "Revoking…" : "Revoke consent"}
        </Button>
      ) : null}

      <p className="text-xs text-muted-foreground">
        <Link href="/dashboard/access-history" className="underline">
          Access history
        </Link>{" "}
        shows when this grant was used.
      </p>
    </div>
  );
}
