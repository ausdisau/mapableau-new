"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function PhoneVerificationPanel({
  initialPhone,
  verifiedPhone,
}: {
  initialPhone?: string | null;
  verifiedPhone?: string | null;
}) {
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"idle" | "sent" | "verified">(
    verifiedPhone ? "verified" : "idle"
  );
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const isVerified = step === "verified" || Boolean(verifiedPhone);

  return (
    <section
      className="space-y-4 rounded-lg border border-border p-4"
      aria-labelledby="phone-verify-heading"
    >
      <h2 id="phone-verify-heading" className="font-heading text-lg font-semibold">
        Phone verification
      </h2>
      <p className="text-sm text-muted-foreground">
        Verify your mobile number to receive SMS or WhatsApp alerts. MapAble never
        sends diagnosis or NDIS plan details by text.
      </p>

      <div className="space-y-2">
        <label htmlFor="verify-phone" className="text-sm font-medium">
          Mobile number
        </label>
        <input
          id="verify-phone"
          type="tel"
          autoComplete="tel"
          className="flex min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isVerified || loading}
          aria-describedby="verify-phone-hint"
        />
        <p id="verify-phone-hint" className="text-xs text-muted-foreground">
          Australian numbers preferred, e.g. 04xx xxx xxx
        </p>
      </div>

      {step === "sent" && !isVerified ? (
        <div className="space-y-2">
          <label htmlFor="verify-code" className="text-sm font-medium">
            Verification code
          </label>
          <input
            id="verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="flex min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!isVerified && step !== "sent" ? (
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              setStatus("");
              const res = await fetch("/api/verify/phone/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
              });
              setLoading(false);
              if (res.ok) {
                setStep("sent");
                setStatus("Code sent. Enter it below.");
              } else {
                const data = await res.json().catch(() => ({}));
                setStatus(data.error ?? "Could not send code.");
              }
            }}
          >
            Send verification code
          </Button>
        ) : null}

        {step === "sent" && !isVerified ? (
          <Button
            type="button"
            variant="default"
            size="default"
            loading={loading}
            onClick={async () => {
              setLoading(true);
              setStatus("");
              const res = await fetch("/api/verify/phone/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, code }),
              });
              setLoading(false);
              if (res.ok) {
                setStep("verified");
                setStatus("Phone verified.");
              } else {
                const data = await res.json().catch(() => ({}));
                setStatus(data.error ?? "Verification failed.");
              }
            }}
          >
            Confirm code
          </Button>
        ) : null}
      </div>

      {isVerified ? (
        <p className="text-sm text-green-700 dark:text-green-400" role="status">
          Verified: {verifiedPhone ?? phone}
        </p>
      ) : null}
      {status ? (
        <p className="text-sm" role="status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </section>
  );
}
