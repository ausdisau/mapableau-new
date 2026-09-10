"use client";

import { useState } from "react";

import type { ConsentedSupportSummary } from "@/lib/ask-mapable/participant-support-plan";
import {
  buildPurposeBoundShareEnvelope,
  revokePurposeBoundShareEnvelope,
  type PurposeBoundShareEnvelope,
  type PurposeBoundShareExpiryPreset,
  type PurposeBoundSharePurpose,
  type PurposeBoundShareRecipientKind,
} from "@/lib/ask-mapable/purpose-bound-sharing";

const PURPOSE_LABELS: Record<PurposeBoundSharePurpose, string> = {
  ask_for_support: "Ask for support",
  share_communication_access: "Share communication access",
  coordinate_follow_up: "Coordinate follow-up support",
};

function makeEnvelopeId() {
  return globalThis.crypto?.randomUUID?.() ?? `support-plan-share-${Date.now()}`;
}

function formatExpiry(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

export function SupportPlanShareEnvelopeCard({
  summary,
}: {
  summary: ConsentedSupportSummary;
}) {
  const [recipientKind, setRecipientKind] =
    useState<PurposeBoundShareRecipientKind>("chosen_person");
  const [recipientLabel, setRecipientLabel] = useState("");
  const [purpose, setPurpose] =
    useState<PurposeBoundSharePurpose>("ask_for_support");
  const [expiryPreset, setExpiryPreset] =
    useState<PurposeBoundShareExpiryPreset>("one_hour");
  const [envelope, setEnvelope] = useState<PurposeBoundShareEnvelope | null>(null);
  const [error, setError] = useState<string | null>(null);

  function prepareEnvelope() {
    const result = buildPurposeBoundShareEnvelope({
      envelopeId: makeEnvelopeId(),
      summary,
      recipientKind,
      recipientLabel,
      purpose,
      expiryPreset,
    });

    if (!result.ok) {
      if (result.issues.includes("RECIPIENT_REQUIRED")) {
        setError(
          "Enter an exact recipient name or service before preparing this envelope.",
        );
      } else {
        setError("Choose at least one non-empty support-plan section first.");
      }
      setEnvelope(null);
      return;
    }

    setError(null);
    setEnvelope(result.envelope);
  }

  function revokeEnvelope() {
    setEnvelope((current) =>
      current ? revokePurposeBoundShareEnvelope(current) : current,
    );
  }

  return (
    <section
      aria-labelledby="support-plan-sharing-heading"
      className="mt-5 rounded-lg border border-border bg-card p-4"
    >
      <h3 id="support-plan-sharing-heading" className="text-lg font-bold">
        Prepare a sharing envelope
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Bind this private preview to one named recipient, one purpose and a short
        expiry. Preparing an envelope does not send anything and does not create
        permission to transmit it.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span>Who is this prepared for?</span>
          <select
            aria-label="Who is this prepared for?"
            value={recipientKind}
            onChange={(event) => {
              setRecipientKind(event.target.value as PurposeBoundShareRecipientKind);
              setEnvelope(null);
              setError(null);
            }}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="chosen_person">A person I choose</option>
            <option value="mapable_human">MapAble human support</option>
            <option value="external_service">An external service</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Exact recipient name or service</span>
          <input
            aria-label="Exact recipient name or service"
            value={recipientLabel}
            onChange={(event) => {
              setRecipientLabel(event.target.value);
              setEnvelope(null);
              setError(null);
            }}
            maxLength={160}
            autoComplete="off"
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>Why I want to share this</span>
          <select
            aria-label="Why I want to share this"
            value={purpose}
            onChange={(event) => {
              setPurpose(event.target.value as PurposeBoundSharePurpose);
              setEnvelope(null);
              setError(null);
            }}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ask_for_support">Ask for support</option>
            <option value="share_communication_access">
              Share communication access
            </option>
            <option value="coordinate_follow_up">
              Coordinate follow-up support
            </option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium">
          <span>How long should this prepared envelope last?</span>
          <select
            aria-label="How long should this prepared envelope last?"
            value={expiryPreset}
            onChange={(event) => {
              setExpiryPreset(event.target.value as PurposeBoundShareExpiryPreset);
              setEnvelope(null);
              setError(null);
            }}
            className="min-h-11 w-full rounded-lg border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="one_hour">1 hour</option>
            <option value="one_day">24 hours</option>
            <option value="seven_days">7 days</option>
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={prepareEnvelope}
        className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Prepare sharing envelope
      </button>

      {error ? (
        <p className="mt-3 text-sm font-medium" role="alert">
          {error}
        </p>
      ) : null}

      {envelope ? (
        <section
          data-testid="support-plan-share-envelope"
          aria-labelledby="prepared-support-plan-share-heading"
          className="mt-5 rounded-lg border-2 border-primary/30 bg-muted/30 p-4"
        >
          <h4 id="prepared-support-plan-share-heading" className="font-bold">
            Prepared only — not sent
          </h4>
          <div className="mt-3 space-y-1 text-sm">
            <p>Recipient: {envelope.recipient.label}</p>
            <p>Purpose: {PURPOSE_LABELS[envelope.purpose]}</p>
            <p>Expires: {formatExpiry(envelope.expiresAt)}</p>
            {envelope.status === "REVOKED" ? <p>Status: REVOKED</p> : null}
          </div>

          <dl className="mt-4 space-y-3">
            {envelope.sections.map((section) => (
              <div key={section.label}>
                <dt className="font-semibold">{section.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {section.value}
                </dd>
              </div>
            ))}
          </dl>

          {envelope.status === "REVOKED" ? (
            <p className="mt-4 text-sm leading-6">
              This local prepared envelope was never sent. Revoking it here does
              not claim external deletion or recall.
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6">
                This prepared envelope does not create permission to send.
              </p>
              <p className="mt-2 text-sm leading-6">
                External acceptance has not been confirmed.
              </p>
              <button
                type="button"
                onClick={revokeEnvelope}
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-border px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Revoke this prepared envelope
              </button>
            </>
          )}
        </section>
      ) : null}
    </section>
  );
}
