import Link from "next/link";

export default function IntakeHomePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Support intake</h1>
      <p className="text-muted-foreground">
        Describe what you need in plain language. Nothing is booked until you review
        and confirm.
      </p>
      <Link href="/intake/chat" className="mr-4 text-primary underline">
        Chat intake
      </Link>
      <Link href="/intake/form" className="text-primary underline">
        Step-by-step form
      </Link>
    </main>
  );
}
