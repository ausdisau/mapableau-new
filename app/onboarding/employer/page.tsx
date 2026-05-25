import { EmployerOnboardingForm } from "@/components/onboarding/EmployerOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Employer onboarding | MapAble" };

export default function EmployerOnboardingPage() {
  return (
    <OnboardingShell
      title="Inclusive employer"
      description="Job posting permission is granted after profile approval."
      step={3}
      totalSteps={3}
      stepLabel="Employer profile"
    >
      <EmployerOnboardingForm />
    </OnboardingShell>
  );
}
