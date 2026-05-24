"use client";

import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type TotpSetupCardProps = {
  onEnrolled: (recoveryCodes: string[]) => void;
};

type SetupState = {
  challengeId: string;
  qrDataUrl: string;
  manualKey: string;
};

export function TotpSetupCard({ onEnrolled }: TotpSetupCardProps) {
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function startSetup() {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/mfa/totp/enroll/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start setup");
        return;
      }
      setSetup({
        challengeId: data.challengeId,
        qrDataUrl: data.qrDataUrl,
        manualKey: data.manualKey,
      });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setup) return;
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/mfa/totp/enroll/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: setup.challengeId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Code did not match");
        return;
      }
      onEnrolled(data.recoveryCodes as string[]);
      setSetup(null);
      setCode("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!setup) {
    return (
      <section
        aria-labelledby="totp-setup-heading"
        className="space-y-4 rounded-lg border border-border p-6"
      >
        <h2 id="totp-setup-heading" className="text-lg font-semibold">
          Authenticator app (recommended)
        </h2>
        <p className="text-sm text-muted-foreground">
          Use an app such as Google Authenticator, Microsoft Authenticator, or
          1Password. You will scan a QR code or enter a setup key manually.
        </p>
        <Button
          type="button"
          variant="default"
          size="lg"
          disabled={isLoading}
          onClick={startSetup}
          aria-busy={isLoading}
        >
          {isLoading ? "Preparing…" : "Set up authenticator app"}
        </Button>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="totp-verify-heading"
      className="space-y-4 rounded-lg border border-border p-6"
    >
      <h2 id="totp-verify-heading" className="text-lg font-semibold">
        Scan or enter your setup key
      </h2>
      <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Open your authenticator app and choose add account.</li>
        <li>Scan the QR code below, or enter the manual key.</li>
        <li>Enter the 6-digit code from the app to confirm.</li>
      </ol>

      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <Image
          src={setup.qrDataUrl}
          alt="QR code for authenticator setup"
          width={200}
          height={200}
          className="rounded-md border border-border"
          unoptimized
        />
        <div className="space-y-2">
          <p className="text-sm font-medium">Manual setup key</p>
          <code className="block break-all rounded-md bg-muted px-3 py-2 text-sm">
            {setup.manualKey}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigator.clipboard.writeText(setup.manualKey)}
          >
            Copy setup key
          </Button>
        </div>
      </div>

      <form onSubmit={confirmSetup} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="totp-confirm-code" className="text-sm font-medium">
            6-digit verification code
          </label>
          <input
            id="totp-confirm-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={isLoading}
            className="w-full max-w-xs rounded-lg border border-input bg-background px-3 py-2.5 text-lg tracking-widest shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div aria-live="polite" aria-atomic="true" className="min-h-[1.25rem]">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="default"
            size="default"
            disabled={isLoading || code.length < 6}
            aria-busy={isLoading}
          >
            {isLoading ? "Verifying…" : "Confirm authenticator"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setSetup(null)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
