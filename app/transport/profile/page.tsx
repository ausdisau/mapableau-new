import Link from "next/link";

import { TransportAccessProfileForm } from "@/components/transport/TransportAccessProfileForm";
import { requireAuth } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transport Access Profile | MapAble Transport",
  description:
    "Maintain mobility, boarding, assistance, and consent preferences for accessible transport.",
};

export default async function TransportProfilePage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <p>
        <Link
          href="/transport/dashboard"
          className="text-sm font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          ← Back to transport dashboard
        </Link>
      </p>
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Transport Access Profile</h1>
        <p className="text-sm text-muted-foreground">
          Share the minimum practical information needed for safe transport
          matching. Diagnosis is not required. Exact addresses are not shown
          here.
        </p>
      </header>
      <TransportAccessProfileForm />
    </div>
  );
}
