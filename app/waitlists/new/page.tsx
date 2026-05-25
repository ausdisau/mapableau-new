import { WaitlistRequestForm } from "@/components/waitlists/WaitlistRequestForm";

export default function NewWaitlistPage() {
  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="font-heading text-2xl font-bold">Join a waitlist</h1>
      <WaitlistRequestForm />
    </div>
  );
}
