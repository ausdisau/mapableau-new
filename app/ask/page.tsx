import Link from "next/link";
import { Suspense } from "react";

import { AskPageClient } from "./AskPageClient";
import Footer from "@/components/footer";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Ask MapAble | MapAble",
  description:
    "Accessible Co-Pilot guidance with participant-controlled PRMS records underneath.",
};

export default function AskPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-card/80 px-4 py-4">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-lg font-bold text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            MapAble
          </Link>
          <nav aria-label="Main" className="flex flex-wrap gap-4 text-sm">
            <Link href="/core" className="hover:underline focus-visible:ring-2">
              Core hub
            </Link>
            <Link href="/login" className="hover:underline focus-visible:ring-2">
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="container mx-auto max-w-3xl px-4 py-10">
        <Badge
          variant="outline"
          className="mb-4 border-primary/20 bg-primary/5 text-primary"
        >
          Co-Pilot + PRMS
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ask MapAble
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Friendly guidance on the surface. Participant records, consent checks,
          and evidence underneath.
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <p className="text-muted-foreground">Loading Ask MapAble…</p>
            }
          >
            <AskPageClient />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
