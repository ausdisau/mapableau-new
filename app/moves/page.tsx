import Link from "next/link";

export default function MovesHomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">MapAble Moves</h1>
      <p className="text-muted-foreground">
        Book allied health and rehabilitation appointments. MapAble is not a clinical
        decision tool.
      </p>
      <Link href="/moves/book" className="inline-flex min-h-11 items-center rounded bg-primary px-4 text-primary-foreground">
        Book appointment
      </Link>
    </main>
  );
}
