import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";

export const metadata = {
  title: "Emergency profile | MapAble",
  description: "Emergency contacts and key information",
};

export default async function EmergencyProfilePage() {
  const user = await requireAuth();

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <h1 className="font-heading text-2xl font-bold">Emergency profile</h1>
      <p className="text-sm text-muted-foreground">
        Share only what you are comfortable showing in urgent situations. Full
        clinical details stay in protected areas of MapAble.
      </p>
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-2 text-sm">{user.name}</p>
        <p className="text-sm text-muted-foreground">
          Update emergency contacts in your profile settings.
        </p>
        <Link
          href="/dashboard/profile"
          className="mt-4 inline-flex min-h-11 items-center text-primary underline"
        >
          Edit profile
        </Link>
      </section>
    </div>
  );
}
