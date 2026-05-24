import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthShell } from "@/components/auth/AuthShell";
import { requireAuth } from "@/lib/auth/guards";
import { PRIVILEGED_ROLES } from "@/lib/auth/role-onboarding-router";

import RoleSelectionForm from "./RoleSelectionForm";

const ROLE_OPTIONS = [
  { value: "participant", label: "Participant", description: "Access your NDIS supports and bookings." },
  { value: "family_member", label: "Nominee or family", description: "Support a participant with consent." },
  { value: "support_coordinator", label: "Support coordinator", description: "Coordinate supports for participants." },
  { value: "plan_manager", label: "Plan manager", description: "Manage plan budgets and invoices." },
  { value: "provider_admin", label: "Provider", description: "Requires MapAble verification and approval." },
  { value: "support_worker", label: "Support worker", description: "Requires verification before shifts." },
  { value: "driver", label: "Driver", description: "Requires transport verification." },
] as const;

export default async function OnboardingRolePage() {
  await requireAuth("/login?returnTo=/onboarding/role");

  return (
    <AuthShell>
      <AuthCard>
        <h1 className="text-2xl font-bold">How will you use MapAble?</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Provider, worker, driver and admin roles are never granted automatically
          from sign-in. MapAble will guide you through verification where required.
        </p>
        <RoleSelectionForm roles={ROLE_OPTIONS} privilegedRoles={PRIVILEGED_ROLES} />
      </AuthCard>
    </AuthShell>
  );
}
