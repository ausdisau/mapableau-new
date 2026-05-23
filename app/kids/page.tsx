import Link from "next/link";

export default function KidsHomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">MapAble Kids</h1>
      <p className="text-muted-foreground">
        Find accessible playgrounds and activities. Child identities are never shown
        publicly.
      </p>
      <Link href="/kids/places" className="text-primary underline">
        Explore places
      </Link>
      <Link href="/kids/family" className="ml-4 text-primary underline">
        Family profile
      </Link>
    </main>
  );
}
