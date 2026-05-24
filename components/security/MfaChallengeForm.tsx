"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { stepUpActionLabel, type StepUpAction } from "@/lib/auth/mfa-policy";

type MfaChallengeFormProps = {
  mode: "login" | "step_up";
  action?: StepUpAction;
};

export function MfaChallengeForm({ mode, action }: MfaChallengeFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bootstrapDone, setBootstrapDone] = useState(false);

  useEffect(() => {
    if (bootstrapDone || mode !== "login") return;
    void (async () => {
      try {
        const res = await fetch("/api/mfa/trusted-bootstrap", {
          method: "POST",
        });
        const data = await res.json();
        if (data.ok && data.sessionUpdate) {
          await update(data.sessionUpdate);
          router.push(callbackUrl);
          router.refresh();
        }
      } finally {
        setBootstrapDone(true);
      }
    })();
  }, [bootstrapDone, mode, update, router, callbackUrl]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          mode,
          action,
          useRecoveryCode: useRecovery,
          trustDevice,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Verification failed. Try again.");
        setIsLoading(false);
        return;
      }

      await update(data.sessionUpdate);

      if (data.codesRemaining !== undefined && data.codesRemaining < 3) {
        setInfo(
          `You have ${data.codesRemaining} recovery codes left. Consider generating new codes in security settings.`,
        );
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  const title =
    mode === "step_up" && action
      ? `Confirm: ${stepUpActionLabel(action)}`
      : "Verify it is you";

  return (
    <form onSubmit={submit} className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {useRecovery
            ? "Enter one of your recovery codes. Each code works only once."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </header>

      <div className="space-y-2">
        <label htmlFor="mfa-code" className="text-sm font-medium">
          {useRecovery ? "Recovery code" : "Authentication code"}
        </label>
        <input
          id="mfa-code"
          inputMode={useRecovery ? "text" : "numeric"}
          autoComplete="one-time-code"
          required
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isLoading}
          className="w-full max-w-sm rounded-lg border border-input bg-background px-3 py-2.5 text-lg shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-describedby="mfa-code-hint"
        />
        <p id="mfa-code-hint" className="text-xs text-muted-foreground">
          {useRecovery
            ? "Format example: ABCD-1234"
            : "Codes refresh every 30 seconds."}
        </p>
      </div>

      {mode === "login" ? (
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-input"
          />
          <span>
            Trust this device for 30 days (skip MFA on this browser when safe)
          </span>
        </label>
      ) : null}

      <div aria-live="polite" aria-atomic="true" className="min-h-[1.25rem] space-y-1">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="text-sm text-foreground" role="status">
            {info}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="default"
          size="lg"
          disabled={isLoading || code.length < 6}
          aria-busy={isLoading}
        >
          {isLoading ? "Verifying…" : "Continue"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={() => {
            setUseRecovery((v) => !v);
            setCode("");
            setError("");
          }}
        >
          {useRecovery ? "Use authenticator app" : "Use a recovery code"}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Locked out?{" "}
        <a
          href="mailto:support@mapable.com.au?subject=MFA%20account%20recovery"
          className="underline underline-offset-2"
        >
          Contact MapAble support
        </a>{" "}
        with your account email. We will never ask for your recovery codes by
        phone or chat.
      </p>

      <p className="text-sm">
        <Link href="/settings/security" className="underline underline-offset-2">
          Security settings
        </Link>
      </p>
    </form>
  );
}
