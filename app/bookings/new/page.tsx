import { BookingWizard } from "@/components/bookings/BookingWizard";

export default function NewBookingPage() {
  return (
    <main className="container py-8">
      <h1 className="mb-6 font-heading text-2xl font-bold">Request support</h1>
      <BookingWizard />
    </main>
  );
}
