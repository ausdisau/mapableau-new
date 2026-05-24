import Link from "next/link";

export default function TourismHomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">MapAble Tourism</h1>
      <p className="text-muted-foreground">
        Plan accessible travel. Verification status is shown — unverified places are
        not guaranteed accessible.
      </p>
      <Link href="/tourism/itinerary/new" className="text-primary underline">
        Build an itinerary
      </Link>
    </main>
  );
}
