import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ProviderNotFound() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Provider not found
      </h1>
      <p className="mt-3 text-muted-foreground">
        We could not find a provider matching this link. Try searching again in
        Provider Finder.
      </p>
      <Button asChild variant="default" size="lg" className="mt-6">
        <Link href="/provider-finder">Open Provider Finder</Link>
      </Button>
    </div>
  );
}
