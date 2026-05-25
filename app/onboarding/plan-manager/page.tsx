import { PlanManagerOnboardingForm } from "@/components/onboarding/PlanManagerOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Plan manager onboarding | MapAble" };

export default function PlanManagerOnboardingPage() {
  return (
    <OnboardingShell
      title="Plan manager"
      description="Invoice access requires participant or nominee consent before viewing billing."
      step={3}
      totalSteps={3}
      stepLabel="Plan manager details"
    >
      <PlanManagerOnboardingForm />
    </OnboardingShell>
  );
}
