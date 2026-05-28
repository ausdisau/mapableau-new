import Link from "next/link";

export const metadata = {
  title: "Terms of Service | MapAble",
  description: "Terms governing use of the MapAble platform.",
};

export default function TermsOfServicePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: May 2026 · Australian Disability Ltd (MapAble)
      </p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
        <p>
          By using MapAble you agree to these terms. If you do not agree, do not
          use the service.
        </p>

        <h2>Eligibility and accounts</h2>
        <p>
          You must provide accurate information and keep credentials secure.
          Organisation administrators are responsible for members they invite.
        </p>

        <h2>Platform role</h2>
        <p>
          MapAble provides software for care coordination, transport, peer
          support, provider operations, and related services. We are not an NDIS
          provider, plan manager, or insurer unless explicitly stated in a
          separate agreement.
        </p>

        <h2>NDIS and billing</h2>
        <p>
          Pricing displays and invoice placeholders may reference NDIS catalogue
          data for convenience. Providers remain responsible for compliant
          claiming, invoicing, and record-keeping. MapAble does not auto-submit
          claims to the NDIA unless a future feature is explicitly enabled and
          contracted.
        </p>

        <h2>Acceptable use</h2>
        <p>
          You must not misuse the platform, harass others, circumvent safeguards,
          or attempt unauthorised access. We may suspend accounts that breach
          these terms or safeguarding policies.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the extent permitted by law, MapAble is provided &quot;as is&quot;.
          Our liability is limited as allowed under the Australian Consumer Law
          and these terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions:{" "}
          <a href="mailto:legal@mapable.com.au">legal@mapable.com.au</a>
        </p>

        <p className="text-sm text-muted-foreground">
          <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/support" className="text-primary underline-offset-2 hover:underline">
            Support
          </Link>
        </p>
      </div>
    </main>
  );
}
