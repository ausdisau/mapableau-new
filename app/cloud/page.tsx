import Link from "next/link";

export const metadata = { title: "MapAble Cloud" };

export default function CloudPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">MapAble Cloud</h1>
      <p className="text-muted-foreground">
        Provider workspace for rostering, billing, and compliance on MapAble infrastructure.
      </p>
      <Link href="/cloud/workspace" className="min-h-12 inline-flex items-center rounded-lg bg-primary px-6 text-primary-foreground">
        Open workspace
      </Link>
    </main>
  );
}
