import Link from "next/link";

export default function AgeHomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-4 text-lg">
      <h1 className="font-heading text-3xl font-bold">MapAble Age</h1>
      <p className="text-muted-foreground">
        Respectful support for ageing at home. Larger text and simple steps.
      </p>
      <Link
        href="/age/intake"
        className="inline-flex min-h-14 items-center rounded-lg bg-primary px-6 text-xl text-primary-foreground"
      >
        Start intake
      </Link>
    </main>
  );
}
