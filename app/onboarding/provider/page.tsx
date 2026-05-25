import { ProviderOnboardingForm } from "@/components/onboarding/ProviderOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Provider onboarding | MapAble" };

export default function ProviderOnboardingPage() {
  return (
    <OnboardingShell
      title="Provider organisation"
      description="Listing and booking eligibility require verification. No bank details at signup."
      step={3}
      totalSteps={3}
      stepLabel="Provider details"
    >
      <ProviderOnboardingForm />
    </OnboardingShell>
  );
}
