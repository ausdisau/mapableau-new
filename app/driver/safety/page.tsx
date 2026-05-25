import { FieldModeShell } from "@/components/field/FieldModeShell";
import { SafetyCheckCard } from "@/components/field/SafetyCheckCard";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Safety | MapAble Driver" };

export default async function DriverSafetyPage() {
  await requireAuth();

  return (
    <FieldModeShell title="Safety">
      <SafetyCheckCard />
      <p className="text-sm text-muted-foreground">
        Complete the checklist before marking a trip ready. Critical failures
        block ready status until resolved.
      </p>
    </FieldModeShell>
  );
}
