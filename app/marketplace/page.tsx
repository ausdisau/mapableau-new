import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function MarketplacePage() {
  const listings = await prisma.atMarketplaceListing.findMany({
    where: { status: "published" },
    take: 12,
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Assistive technology marketplace</h1>
      <p className="text-muted-foreground">
        NDIS funding notes are guidance only — confirm eligibility with your plan manager.
      </p>
      <Link href="/marketplace/listings/new" className="text-primary underline">
        List an item
      </Link>
      <ul className="grid gap-4 sm:grid-cols-2">
        {listings.map((l) => (
          <li key={l.id} className="rounded border p-4">
            <Link href={`/marketplace/listings/${l.id}`} className="font-medium underline">
              {l.title}
            </Link>
            <p className="text-sm text-muted-foreground">{l.listingType}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
