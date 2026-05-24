import Link from "next/link";

import { AlliedHealthBookingForm } from "@/components/moves/AlliedHealthBookingForm";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Book therapy | MapAble Moves" };

export default async function BookTherapyPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <Link href="/dashboard/moves" className="text-sm text-primary hover:underline">
        ← Moves
      </Link>
      <h1 className="font-heading text-2xl font-bold">Book allied health</h1>
      <AlliedHealthBookingForm />
    </div>
  );
}
