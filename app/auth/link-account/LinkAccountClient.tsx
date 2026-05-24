"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type LinkAccountClientProps = {
  token: string;
  providerLabel: string;
};

export function LinkAccountClient({
  token,
  providerLabel,
}: LinkAccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get("callbackUrl") ?? "/auth/complete";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!token) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Missing or invalid link. Return to sign in and try connecting your
        account again.
      </p>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
          const res = await fetch("/api/auth/confirm-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
          });
          const data = (await res.json()) as {
            error?: string;
            ok?: boolean;
            nextAuthProvider?: string | null;
            message?: string;
          };

          if (!res.ok) {
            setError(data.error ?? "Could not link account. Please try again.");
            setIsLoading(false);
            return;
          }

          setSuccess(
            data.message ??
              `${providerLabel} linked. Continue with that option to sign in.`,
          );
          setIsLoading(false);

          if (data.nextAuthProvider) {
            await signIn(data.nextAuthProvider, { callbackUrl });
            return;
          }

          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        } catch {
          setError("Something went wrong. Please try again.");
          setIsLoading(false);
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        To link <strong>{providerLabel}</strong>, enter the password for your
        existing MapAble email account. We will not merge accounts without your
        confirmation.
      </p>

      <div className="space-y-2">
        <label htmlFor="link-password" className="text-sm font-medium">
          Current MapAble password
        </label>
        <input
          id="link-password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div aria-live="polite" aria-atomic="true" className="min-h-[1.25rem]">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-foreground" role="status">
            {success}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        variant="default"
        size="lg"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Confirming…" : "Confirm and link account"}
      </Button>
    </form>
  );
}
