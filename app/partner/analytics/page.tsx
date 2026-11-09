import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * No partner-scoped reporting warehouse has been connected to this page.
 * Never display invented incidents, recorded assessment dates or downloads
 * that do not actually exist.
 */
export default function PartnerAnalyticsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-bold">Analytics &amp; Data</h2>
        <p className="max-w-2xl text-muted-foreground">
          Understand the accessibility information that may become available
          for the places, routes and facilities your organisation manages.
          Verified partner-specific reports are not connected to this page yet.
        </p>
      </header>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Accessibility evidence and reports</CardTitle>
          <CardDescription>
            No authorised partner analytics dataset is connected. This view
            does not display actual incidents, access scores or assessment results.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div role="status" className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-5">
            <p className="font-semibold">No verified report is available</p>
            <p className="text-sm text-muted-foreground">
              Data collection, source attribution, review, consent and minimum
              reporting thresholds must be established before any report can be
              shown or exported. Missing data is not evidence that a barrier
              does not exist.
            </p>
            <Link href="/contact" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Enquire about accessibility reporting
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
