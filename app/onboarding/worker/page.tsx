import { WorkerOnboardingForm } from "@/components/onboarding/WorkerOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Support worker onboarding | MapAble" };

export default function WorkerOnboardingPage() {
  return (
    <OnboardingShell
      title="Support worker profile"
      description="Submit your profile now. Matching stays unavailable until verification checks pass."
      step={3}
      totalSteps={3}
      stepLabel="Worker details"
    >
      <WorkerOnboardingForm />
    </OnboardingShell>
  );
}
