import { OnboardingShell } from "@/components/registration/OnboardingShell";
import { RoleSelectionForm } from "@/components/registration/RoleSelectionForm";

export const metadata = {
  title: "Choose your role | MapAble",
};

export default function OnboardingRolePage() {
  return (
    <OnboardingShell
      title="How will you use MapAble?"
      description="Choose the role that best describes you. You will complete a short profile next — no NDIS number, bank details, or medical history required at signup."
      step={1}
      totalSteps={3}
      stepLabel="Role selection"
    >
      <RoleSelectionForm />
    </OnboardingShell>
  );
}
