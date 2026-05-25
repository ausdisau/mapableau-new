"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { OnboardingShell } from "@/components/registration/OnboardingShell";
import { evaluateEligibility } from "@/lib/onboarding/eligibility-gates";
import { dashboardTargetForRole } from "@/lib/onboarding/onboarding-router";
import type { RegistrationRole } from "@/types/registration";

export default function OnboardingCompletePage() {
  const [role, setRole] = useState<RegistrationRole | null>(null);
  const [status, setStatus] = useState("");
  const [badge, setBadge] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/onboarding/status");
      const data = (await res.json()) as {
        selectedRole: RegistrationRole | null;
        onboardingStatus: string;
        eligibilityStatus?: string;
      };
      if (data.selectedRole) {
        setRole(data.selectedRole);
        const ev = evaluateEligibility(
          data.selectedRole,
          data.onboardingStatus === "complete" ||
            data.onboardingStatus === "submitted"
        );
        setBadge(ev.badge);
        setStatus(ev.message);
      }
    })();
  }, []);

  const dashboard = role ? dashboardTargetForRole(role) : "/dashboard";

  return (
    <OnboardingShell
      title="Onboarding submitted"
      description="Thank you. Your information is saved. Some features stay locked until verification or consent is in place."
      step={3}
      totalSteps={3}
      stepLabel="Complete"
    >
      <div className="space-y-4 rounded-lg border border-border bg-card p-6">
        {badge ? (
          <p className="inline-flex rounded-full bg-muted px-3 py-1 text-sm font-medium">
            Status: {badge}
          </p>
        ) : null}
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        <Link
          href={dashboard}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Go to your dashboard
        </Link>
      </div>
    </OnboardingShell>
  );
}
