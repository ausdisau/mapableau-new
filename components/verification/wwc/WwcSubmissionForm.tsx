"use client";

import { useMemo, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import { WwcEvidenceUpload } from "@/components/verification/wwc/WwcEvidenceUpload";
import {
  WWC_CHECK_TYPES_BY_JURISDICTION,
  WWC_JURISDICTIONS,
  type WwcCheckType,
  type WwcJurisdiction,
} from "@/types/wwc-verification";

const JURISDICTION_LABELS: Record<WwcJurisdiction, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  TAS: "Tasmania",
  ACT: "Australian Capital Territory",
  NT: "Northern Territory",
};

const CHECK_LABELS: Record<WwcCheckType, string> = {
  working_with_children_check: "Working With Children Check",
  blue_card: "Blue Card",
  working_with_vulnerable_people: "Working With Vulnerable People registration",
  ochre_card: "Ochre Card",
};

export function WwcSubmissionForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [jurisdiction, setJurisdiction] = useState<WwcJurisdiction>("NSW");
  const checkOptions = WWC_CHECK_TYPES_BY_JURISDICTION[jurisdiction];
  const [checkType, setCheckType] = useState<WwcCheckType>(checkOptions[0]!);
  const [checkNumber, setCheckNumber] = useState("");
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [evidenceDocumentId, setEvidenceDocumentId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requiresDob = useMemo(
    () => ["QLD", "WA"].includes(jurisdiction),
    [jurisdiction]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    setMessage("");
    setLoading(true);

    const res = await fetch("/api/verification/wwc/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jurisdiction,
        checkType,
        checkNumber,
        legalFirstName,
        legalLastName,
        dateOfBirth: dateOfBirth || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        evidenceDocumentId,
        consentConfirmed: consent,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrors([data.error ?? "Submission failed"]);
      return;
    }
    setMessage("Your check has been submitted for review.");
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Child-related checks are state and territory based. MapAble reviews your submission — we do not display criminal history details to participants.
      </p>

      {errors.length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm"
        >
          <p className="font-medium">Please fix the following:</p>
          <ul className="mt-1 list-disc pl-5">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <label htmlFor="wwc-jurisdiction" className="block text-sm font-medium">
          State or territory
        </label>
        <select
          id="wwc-jurisdiction"
          className={formInputClass}
          value={jurisdiction}
          onChange={(e) => {
            const j = e.target.value as WwcJurisdiction;
            setJurisdiction(j);
            setCheckType(WWC_CHECK_TYPES_BY_JURISDICTION[j][0]!);
          }}
        >
          {WWC_JURISDICTIONS.map((j) => (
            <option key={j} value={j}>
              {JURISDICTION_LABELS[j]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="wwc-check-type" className="block text-sm font-medium">
          Check type
        </label>
        <select
          id="wwc-check-type"
          className={formInputClass}
          value={checkType}
          onChange={(e) => setCheckType(e.target.value as WwcCheckType)}
        >
          {checkOptions.map((ct) => (
            <option key={ct} value={ct}>
              {CHECK_LABELS[ct]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="wwc-check-number" className="block text-sm font-medium">
          Check number
        </label>
        <input
          id="wwc-check-number"
          className={formInputClass}
          value={checkNumber}
          onChange={(e) => setCheckNumber(e.target.value)}
          required
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="wwc-first-name" className="block text-sm font-medium">
            Legal first name
          </label>
          <input
            id="wwc-first-name"
            className={formInputClass}
            value={legalFirstName}
            onChange={(e) => setLegalFirstName(e.target.value)}
            required
            autoComplete="given-name"
          />
        </div>
        <div>
          <label htmlFor="wwc-last-name" className="block text-sm font-medium">
            Legal last name
          </label>
          <input
            id="wwc-last-name"
            className={formInputClass}
            value={legalLastName}
            onChange={(e) => setLegalLastName(e.target.value)}
            required
            autoComplete="family-name"
          />
        </div>
      </div>

      {requiresDob ? (
        <div>
          <label htmlFor="wwc-dob" className="block text-sm font-medium">
            Date of birth
          </label>
          <input
            id="wwc-dob"
            type="date"
            className={formInputClass}
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="wwc-expires" className="block text-sm font-medium">
          Expiry date (if known)
        </label>
        <input
          id="wwc-expires"
          type="date"
          className={formInputClass}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>

      <WwcEvidenceUpload onUploaded={setEvidenceDocumentId} />

      <label className="flex gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border"
        />
        <span>
          I confirm the information is accurate and I consent to MapAble reviewing this check for child-related supports. This is not a substitute for NDIS Worker Screening.
        </span>
      </label>

      <Button type="submit" variant="default" size="default" loading={loading}>
        Submit for review
      </Button>

      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
    </form>
  );
}
