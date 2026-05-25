"use client";

import { useState } from "react";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";

export function AccountLinkingConfirmation({ token }: { token: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function confirmLink() {
    setLoading(true);
    setErrors([]);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors([data.error ?? "Could not link accounts"]);
        return;
      }
      setStatus("Account linked. Redirecting…");
      window.location.href = "/auth/callback-handler";
    } catch {
      setErrors(["Network error. Please try again."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm">
        An account with this email already exists. Confirm that you want to link
        your Google sign-in to your existing MapAble profile.
      </p>
      <AuthErrorSummary errors={errors} />
      {status && (
        <p className="text-sm text-foreground" aria-live="polite">
          {status}
        </p>
      )}
      <button
        type="button"
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        disabled={loading}
        onClick={confirmLink}
      >
        {loading ? "Linking…" : "Confirm account linking"}
      </button>
    </div>
  );
}
