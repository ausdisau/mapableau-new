import Link from "next/link";

export const metadata = { title: "MapAble Emergency" };

export default function EmergencyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Emergency readiness</h1>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950">
        MapAble Emergency supports planning and check-ins. It does not replace emergency
        services. In an emergency, call 000 (Australia).
      </p>
      <nav className="flex flex-col gap-3">
        <Link
          href="/emergency/profile"
          className="min-h-12 rounded-lg bg-primary px-4 py-3 text-center text-primary-foreground"
        >
          Emergency profile
        </Link>
        <Link
          href="/emergency/check-in"
          className="min-h-12 rounded-lg border px-4 py-3 text-center"
        >
          Safety check-in
        </Link>
      </nav>
    </main>
  );
}
