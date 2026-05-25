import { BookingWizard } from "@/components/bookings/BookingWizard";
import { PageContainer } from "@/components/layout/PageContainer";

export const metadata = { title: "New booking | MapAble" };

export default function NewBookingPage() {
  return (
    <PageContainer title="New booking request">
      <p className="text-sm text-slate-600 mb-6">
        Follow each step. After you submit, your provider can review the request.
        You control consent for sharing accessibility details.
      </p>
      <BookingWizard />
    </PageContainer>
  );
}
