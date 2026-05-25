import Link from "next/link";

import { WaitlistStatusCard } from "@/components/waitlists/WaitlistStatusCard";
import { requireAuth } from "@/lib/auth/guards";
import { listWaitlists } from "@/lib/capacity/waitlist-service";

export default async function WaitlistsPage() {
  const user = await requireAuth();
  let waitlists: Awaited<ReturnType<typeof listWaitlists>> = [];
  try {
    waitlists = await listWaitlists(user.id);
  } catch {
    waitlists = [];
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold">Waitlists</h1>
        <Link href="/waitlists/new" className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Join a waitlist
        </Link>
      </header>
      <ul className="space-y-3">
        {waitlists.map((w) => (
          <li key={w.id}>
            <WaitlistStatusCard waitlist={w} />
          </li>
        ))}
      </ul>
    </div>
  );
}
