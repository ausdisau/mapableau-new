import { SupportCoordinatorOnboardingForm } from "@/components/onboarding/SupportCoordinatorOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Support coordinator onboarding | MapAble" };

export default function SupportCoordinatorOnboardingPage() {
  return (
    <OnboardingShell
      title="Support coordinator"
      description="Participant access always requires an active consent link."
      step={3}
      totalSteps={3}
      stepLabel="Coordinator profile"
    >
      <SupportCoordinatorOnboardingForm />
    </OnboardingShell>
  );
}
