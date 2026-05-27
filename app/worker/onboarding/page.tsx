"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { WorkerAvailabilityForm } from "@/components/forms/WorkerAvailabilityForm";
import { WorkerProfileForm } from "@/components/forms/WorkerProfileForm";
import { Button } from "@/components/ui/button";

type Step = "basics" | "availability" | "done";

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("basics");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    displayName: string;
    profileSummary: string | null;
    serviceTypes: string[];
    serviceRegions: string[];
    specialisations: string[];
    languages: string[];
    qualificationsSummary: string | null;
  } | null>(null);
  const [windows, setWindows] = useState<
    { dayOfWeek: "MONDAY"; startTime: string; endTime: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/worker-profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile({
            displayName: data.profile.displayName,
            profileSummary: data.profile.profileSummary,
            serviceTypes: data.profile.serviceTypes ?? [],
            serviceRegions: data.profile.serviceRegions ?? [],
            specialisations: data.profile.specialisations ?? [],
            languages: data.profile.languages ?? [],
            qualificationsSummary: data.profile.qualificationsSummary,
          });
          setWindows(
            (data.profile.availabilityWindows ?? []).map(
              (w: {
                dayOfWeek: "MONDAY";
                startTime: string;
                endTime: string;
              }) => ({
                dayOfWeek: w.dayOfWeek,
                startTime: w.startTime,
                endTime: w.endTime,
              })
            )
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !profile) {
    return <p className="text-muted-foreground">Loading your profile…</p>;
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="font-heading text-2xl font-bold">Worker onboarding</h1>
      <p className="text-muted-foreground text-sm">
        Step {step === "basics" ? "1" : step === "availability" ? "2" : "3"} of
        3 — set up your profile so providers can match you to shifts.
      </p>

      {step === "basics" && (
        <>
          <WorkerProfileForm
            initial={profile}
            onSuccessRedirect={undefined}
          />
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => setStep("availability")}
          >
            Continue to availability
          </Button>
        </>
      )}

      {step === "availability" && (
        <>
          <WorkerAvailabilityForm
            initialWindows={windows}
            onSaved={() => setStep("done")}
          />
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => setStep("basics")}
          >
            Back
          </Button>
        </>
      )}

      {step === "done" && (
        <div className="space-y-4">
          <p>Your profile is ready for review. You can update it anytime.</p>
          <Button
            type="button"
            variant="default"
            size="default"
            onClick={() => router.push("/worker/today")}
          >
            Go to today&apos;s shifts
          </Button>
          <Link href="/worker/profile" className="block text-sm underline">
            View profile
          </Link>
        </div>
      )}
    </div>
  );
}
