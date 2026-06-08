"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Listing = {
  id: string;
  title: string;
  category: string;
  organisationId: string | null;
};

export function MarketplaceListingGrid({ listings }: { listings: Listing[] }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function checkout(listingId: string) {
    setBusyId(listingId);
    setMessage(null);
    const res = await fetch("/api/marketplace/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const data = await res.json();
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      setMessage(data.error ?? "Checkout unavailable — sign in and try again.");
    }
    setBusyId(null);
  }

  if (listings.length === 0) {
    return (
      <p className="text-muted-foreground">
        No published listings yet. Check back soon or contact a MapAble partner.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm" role="status">
          {message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => (
          <Card key={listing.id}>
            <CardHeader>
              <CardTitle className="text-lg">{listing.title}</CardTitle>
              <CardDescription>{listing.category}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => void checkout(listing.id)}
                disabled={busyId === listing.id}
              >
                {busyId === listing.id ? "Starting checkout…" : "Buy with Stripe"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
