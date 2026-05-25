import { DriverOnboardingForm } from "@/components/onboarding/DriverOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Driver onboarding | MapAble" };

export default function DriverOnboardingPage() {
  return (
    <OnboardingShell
      title="Transport driver profile"
      description="Dispatch stays unavailable until licence, vehicle, and safety checks are verified."
      step={3}
      totalSteps={3}
      stepLabel="Driver details"
    >
      <DriverOnboardingForm />
    </OnboardingShell>
  );
}
