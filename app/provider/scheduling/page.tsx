import { AvailabilityCalendar } from "@/components/scheduling/AvailabilityCalendar";
import { requireAuth } from "@/lib/auth/guards";

export default async function ProviderSchedulingPage() {
  await requireAuth();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Scheduling</h1>
      <AvailabilityCalendar slots={[]} />
    </div>
  );
}
