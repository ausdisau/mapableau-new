import Link from "next/link";

import {
  COMPLETION_CERTIFICATE_LABEL,
  COMPLIANCE_SUPPORT_DISCLAIMER,
} from "@/lib/academy/config";

export default function AcademyHomePage() {
  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-teal-950 sm:text-5xl">
          MapAble Academy
        </h1>
        <p className="max-w-2xl text-lg text-slate-700">
          Disability-led learning and development for disability support workers
          and NDIS service providers — participant-first, rights-based, and
          transparent about what credentials mean.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/academy/catalogue"
            className="rounded bg-teal-800 px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Browse catalogue
          </Link>
          <Link
            href="/academy/about"
            className="rounded border border-teal-800 px-4 py-2 text-sm font-medium text-teal-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
          >
            Our approach
          </Link>
        </div>
      </header>
      <section aria-labelledby="diff-heading" className="space-y-3">
        <h2 id="diff-heading" className="text-xl font-semibold text-teal-950">
          How we are different
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>Disability-led governance and course approval</li>
          <li>Worker capability passports with expiry and verification</li>
          <li>Accessible multi-format learning (Easy Read, captions, transcripts)</li>
          <li>
            {COMPLETION_CERTIFICATE_LABEL} only — never marketed as accredited
            qualifications
          </li>
        </ul>
        <p className="text-sm text-slate-600">{COMPLIANCE_SUPPORT_DISCLAIMER}</p>
      </section>
    </article>
  );
}
