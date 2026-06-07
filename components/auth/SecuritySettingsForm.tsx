"use client";

import { useState } from "react";

import { AuthAlert } from "@/components/auth/AuthAlert";
import {
  AccessibleFormField,
  formInputClass,
} from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function SecuritySettingsForm({
  initialPhone,
  twilio2FAEnabled,
}: {
  initialPhone: string | null;
  twilio2FAEnabled: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setMessage(null);
        setError(null);
        setIsSaving(true);

        try {
          const response = await fetch("/api/me", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: phone.trim() || null }),
          });
          const data = (await response.json()) as {
            error?: string;
            user?: { phone?: string | null };
          };

          if (!response.ok) {
            setError(data.error ?? "Could not save phone number.");
            setIsSaving(false);
            return;
          }

          setPhone(data.user?.phone ?? "");
          setMessage("Phone number saved.");
          setIsSaving(false);
        } catch {
          setError("Could not save phone number. Please try again.");
          setIsSaving(false);
        }
      }}
    >
      <AccessibleFormField
        id="security-phone"
        label="Mobile number"
        required={twilio2FAEnabled}
        hint={
          twilio2FAEnabled
            ? "Required for SMS two-factor authentication when you sign in with email and password."
            : "Optional. Used for SMS two-factor authentication if enabled for your organisation."
        }
      >
        <input
          id="security-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required={twilio2FAEnabled}
          disabled={isSaving}
          className={formInputClass}
          placeholder="0412 345 678"
        />
      </AccessibleFormField>

      {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <Button type="submit" disabled={isSaving} loading={isSaving}>
        {isSaving ? "Saving…" : "Save phone number"}
      </Button>
    </form>
  );
}
