import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guards";

/**
 * No authorised referral code, tracking ledger or verified credit totals are
 * currently connected to this page. Do not generate shareable pseudo-codes
 * from organisation identifiers or display fictional partner activity.
 */
export default async function PartnerReferralsPage() {
  await requireAuth();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h2 className="font-heading text-2xl font-bold">Referrals</h2>
        <p className="max-w-2xl text-muted-foreground">
          Referral links, onboarding updates and approved credits will be shown
          here once your organisation has an issued referral arrangement.
        </p>
      </header>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Referral link status</CardTitle>
          <CardDescription>
            No authorised partner referral link is connected to this account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p role="status" className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
            A referral link must be explicitly issued before it can be shared or
            used for attribution. No credit or commission entitlement is created
            by this page.
          </p>
          <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
            Ask about partner referrals
          </Link>
        </CardContent>
      </Card>

      <Card variant="default">
        <CardHeader>
          <CardTitle>Referral history</CardTitle>
          <CardDescription>
            No verified organisation referrals, onboarding outcomes or credited
            incentives are available to display.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
            No authorised referral records are connected. Missing records do
            not imply that any referral or payment was completed.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
