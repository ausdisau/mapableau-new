import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export default async function SupportHomePage() {
  await requireAuth();
  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <h1 className="font-heading text-2xl font-bold">Help and support</h1>
      <p className="text-muted-foreground">
        Get help with bookings, billing, accessibility, or account issues.
      </p>
      <Link
        href="/support/tickets/new"
        className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground"
      >
        Open a support ticket
      </Link>
      <Link href="/dashboard/support" className="block text-primary underline">
        View my tickets
      </Link>
    </div>
  );
}
