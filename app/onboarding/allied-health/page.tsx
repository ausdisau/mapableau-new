import { AlliedHealthOnboardingForm } from "@/components/onboarding/AlliedHealthOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Allied health onboarding | MapAble" };

export default function AlliedHealthOnboardingPage() {
  return (
    <OnboardingShell
      title="Allied health practitioner"
      description="Clinical booking requires credential review where applicable."
      step={3}
      totalSteps={3}
      stepLabel="Clinical profile"
    >
      <AlliedHealthOnboardingForm />
    </OnboardingShell>
  );
}
