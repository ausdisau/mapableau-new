import { SchedulingBookingWizard } from "@/components/scheduling/SchedulingBookingWizard";

export default function NewSchedulingPage() {
  return (
    <main className="container py-10">
      <h1 className="font-heading mb-2 text-2xl font-bold">
        Schedule care or transport
      </h1>
      <p className="mb-8 text-muted-foreground">
        Request support using your saved private locations. Map data ©
        OpenStreetMap contributors.
      </p>
      <SchedulingBookingWizard />
    </main>
  );
}
