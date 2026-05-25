import Link from "next/link";

import { SkipToContent } from "@/components/core/SkipToContent";
import { requireAuth } from "@/lib/auth/guards";

export default async function TransportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <SkipToContent />
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <h1 className="font-heading text-xl font-bold">MapAble Transport</h1>
          <nav className="flex flex-wrap gap-4 text-sm" aria-label="Transport">
            <Link href="/transport" className="inline-flex min-h-11 items-center hover:underline">
              Home
            </Link>
            <Link href="/transport/book" className="inline-flex min-h-11 items-center hover:underline">
              Book
            </Link>
            <Link href="/transport/trips" className="inline-flex min-h-11 items-center hover:underline">
              My trips
            </Link>
            <Link href="/dashboard" className="inline-flex min-h-11 items-center text-muted-foreground hover:underline">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
