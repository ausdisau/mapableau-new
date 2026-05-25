import { FamilyOnboardingForm } from "@/components/onboarding/FamilyOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Family / nominee onboarding | MapAble" };

export default function FamilyOnboardingPage() {
  return (
    <OnboardingShell
      title="Family or nominee profile"
      description="Support someone with their consent. Formal nominees may need proof of authority later."
      step={3}
      totalSteps={3}
      stepLabel="Nominee details"
    >
      <FamilyOnboardingForm />
    </OnboardingShell>
  );
}
