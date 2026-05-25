import { TransportBookingForm } from "@/components/transport-mvp/TransportBookingForm";

export default function TransportBookPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-heading text-2xl font-bold">Book transport</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us where you need to go and any access requirements for pickup and drop-off.
        </p>
      </header>
      <TransportBookingForm />
    </div>
  );
}
