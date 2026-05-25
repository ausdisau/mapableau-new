"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { BaseRegistrationForm } from "@/components/registration/BaseRegistrationForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";
import { onboardingPathForRole } from "@/lib/onboarding/onboarding-router";
import type { RegistrationRole } from "@/types/registration";

export function OnboardingBaseClient() {
  const router = useRouter();
  const [role, setRole] = useState<RegistrationRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/onboarding/status");
      if (res.status === 401) {
        router.replace("/login?callbackUrl=/onboarding");
        return;
      }
      const data = (await res.json()) as {
        selectedRole: RegistrationRole | null;
        onboardingStatus: string;
        completedSteps?: string[];
      };
      if (!data.selectedRole) {
        router.replace("/onboarding/role");
        return;
      }
      if (data.completedSteps?.includes("base_registration")) {
        router.replace(
          data.onboardingStatus === "complete" ||
            data.onboardingStatus === "submitted"
            ? "/onboarding/complete"
            : onboardingPathForRole(data.selectedRole)
        );
        return;
      }
      setRole(data.selectedRole);
      setLoading(false);
    })();
  }, [router]);

  if (loading) {
    return (
      <p className="px-4 py-10 text-sm text-muted-foreground" role="status">
        Loading your registration…
      </p>
    );
  }

  if (!role) return null;

  return (
    <OnboardingShell
      title="Your basic details"
      description="Register lightly — we only ask for what we need now. Sensitive information comes later when you book or verify."
      step={2}
      totalSteps={3}
      stepLabel="Basic registration"
    >
      <BaseRegistrationForm role={role} />
    </OnboardingShell>
  );
}
