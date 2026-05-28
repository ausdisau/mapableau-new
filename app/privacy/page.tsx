import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | MapAble",
  description: "How MapAble collects, uses, and protects personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: May 2026 · Australian Disability Ltd (MapAble)
      </p>

      <div className="prose prose-slate mt-8 max-w-none dark:prose-invert">
        <p>
          MapAble provides accessibility-first technology for NDIS participants,
          nominees, providers, workers, and coordinators. This policy explains
          what we collect, why we collect it, and how you can exercise your
          rights under the Privacy Act 1988 (Cth) and applicable state laws.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>Account and profile information (name, email, role, organisation)</li>
          <li>
            Care, transport, and peer-support activity needed to deliver services
            you request
          </li>
          <li>
            Consent records for data sharing between participants, providers, and
            nominees
          </li>
          <li>Technical logs, security events, and support correspondence</li>
        </ul>

        <h2>How we use information</h2>
        <p>
          We use personal information to operate the platform, meet safeguarding
          obligations, improve accessibility, process billing where enabled, and
          comply with law. We do not sell personal information.
        </p>

        <h2>NDIS and sensitive data</h2>
        <p>
          Some information may be sensitive (health, disability, or care-related).
          We collect this only where you or your nominee have provided consent or
          where required to deliver a service you have requested. Access is
          role-based and audited.
        </p>

        <h2>Sharing</h2>
        <p>
          We share information with providers and workers you authorise, subprocessors
          that help us run the platform (e.g. hosting, email, payments), and
          regulators when legally required.
        </p>

        <h2>Retention and security</h2>
        <p>
          We retain data according to operational and legal requirements and apply
          technical and organisational safeguards. Report concerns to{" "}
          <a href="mailto:privacy@mapable.com.au">privacy@mapable.com.au</a>.
        </p>

        <h2>Your rights</h2>
        <p>
          You may request access, correction, or deletion subject to law and
          safeguarding constraints. Contact{" "}
          <a href="mailto:privacy@mapable.com.au">privacy@mapable.com.au</a>.
        </p>

        <p className="text-sm text-muted-foreground">
          <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
            Terms of Service
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
