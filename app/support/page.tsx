import Link from "next/link";

const STATUS_URL =
  process.env.NEXT_PUBLIC_STATUS_PAGE_URL ?? "https://status.mapable.com.au";

export const metadata = {
  title: "Support | MapAble",
  description: "Support tiers and response targets for MapAble users.",
};

export default function SupportPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">Support</h1>
      <p className="mt-2 text-muted-foreground">
        Service levels for participants, providers, workers, and coordinators.
      </p>

      <section className="mt-8 space-y-6">
        <div className="rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">Urgent safeguarding</h2>
          <p className="mt-2 text-sm">
            For immediate risk to life, call <strong>000</strong>. For platform
            safeguarding escalations, email{" "}
            <a href="mailto:safeguarding@mapable.com.au" className="text-primary">
              safeguarding@mapable.com.au
            </a>{" "}
            — target response within 4 business hours.
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">Participants & nominees</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>General help: support@mapable.com.au — 2 business days</li>
            <li>Access and consent changes: 2 business days</li>
            <li>Billing disputes: 5 business days</li>
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">Providers & workers</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Provider Cloud / Care: support@mapable.com.au — 1 business day</li>
            <li>Verification and onboarding: 3 business days</li>
            <li>Production incidents: 4 hours (business hours P1)</li>
          </ul>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">Status & incidents</h2>
          <p className="mt-2 text-sm">
            Public status and incident communication:{" "}
            <a href={STATUS_URL} className="text-primary underline-offset-2 hover:underline">
              {STATUS_URL}
            </a>
          </p>
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href="/support-centre" className="text-primary underline-offset-2 hover:underline">
          Help centre
        </Link>
        {" · "}
        <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
          Privacy
        </Link>
      </p>
    </main>
  );
}
