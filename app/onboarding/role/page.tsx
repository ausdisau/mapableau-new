"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthErrorSummary } from "@/components/auth/AuthErrorSummary";
import { AuthShell } from "@/components/auth/AuthShell";
import { PrivacyConsentPanel } from "@/components/auth/PrivacyConsentPanel";
import { roleLabel } from "@/lib/auth/roles";
import type { UserRole } from "@/types/mapable";

const SELECTABLE_ROLES: UserRole[] = [
  "participant",
  "family_member",
  "support_coordinator",
  "support_worker",
  "provider_admin",
  "transport_operator",
  "driver",
  "employer",
  "plan_manager",
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("participant");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          window.location.href = "/login";
          return;
        }
        if (data.onboarding?.status === "complete") {
          router.replace("/dashboard");
        }
      })
      .catch(() => setErrors(["Could not load your profile."]));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setErrors(["Please accept the privacy and terms notice."]);
      return;
    }
    setLoading(true);
    setErrors([]);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, privacyConsent: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors([data.error ?? "Could not save onboarding"]);
        return;
      }
      setStatus(
        role === "provider_admin" || role === "mapable_admin"
          ? "Your role request is pending approval."
          : "Setup complete. Redirecting…"
      );
      setTimeout(() => router.replace("/auth/callback-handler"), 1200);
    } catch {
      setErrors(["Network error. Please try again."]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose your role">
      <form onSubmit={submit} className="space-y-6">
        <AuthErrorSummary errors={errors} />
        {status && (
          <p className="text-sm" aria-live="polite">
            {status}
          </p>
        )}
        <div>
          <label htmlFor="role-select" className="mb-2 block text-sm font-medium">
            How will you use MapAble?
          </label>
          <select
            id="role-select"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {SELECTABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            Provider, worker, and admin roles require MapAble approval. They are
            never granted automatically from Google sign-in.
          </p>
        </div>
        <PrivacyConsentPanel checked={consent} onChange={setConsent} disabled={loading} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </AuthShell>
  );
}
