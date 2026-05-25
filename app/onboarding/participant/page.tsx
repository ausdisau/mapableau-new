import { ParticipantOnboardingForm } from "@/components/onboarding/ParticipantOnboardingForm";
import { OnboardingShell } from "@/components/registration/OnboardingShell";

export const metadata = { title: "Participant onboarding | MapAble" };

export default function ParticipantOnboardingPage() {
  return (
    <OnboardingShell
      title="Participant profile"
      description="Tell us how MapAble can support you. NDIS number and plan documents are optional."
      step={3}
      totalSteps={3}
      stepLabel="Participant details"
    >
      <ParticipantOnboardingForm />
    </OnboardingShell>
  );
}
