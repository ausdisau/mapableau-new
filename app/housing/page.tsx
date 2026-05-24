import Link from "next/link";

export const metadata = { title: "MapAble Housing" };

export default function HousingPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Accessible housing</h1>
      <p className="text-sm text-muted-foreground">
        Listings are informational. MapAble does not guarantee housing eligibility.
      </p>
      <Link
        href="/housing/search"
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-primary-foreground"
      >
        Search listings
      </Link>
    </main>
  );
}
