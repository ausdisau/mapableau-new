import type { Metadata } from "next";

import { listPublicEcosystemDirectory } from "@/lib/api/certified-ecosystem/ecosystem-service";
import { API_CERTIFICATION_DISCLAIMER } from "@/lib/config/y5-rights-infrastructure";

export const metadata: Metadata = {
  title: "Certified API ecosystem | MapAble",
  description:
    "Public directory of Certified API ecosystem listings. Listings are transparency labels only, not regulatory certification.",
};

const expiryFormatter = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default async function CertifiedApiEcosystemPage() {
  const entries = await listPublicEcosystemDirectory();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-[#0C1833]">
        Certified API ecosystem
      </h1>
      <p className="text-sm leading-6 text-slate-700">
        {API_CERTIFICATION_DISCLAIMER}
      </p>
      {entries.length === 0 ? (
        <p className="text-sm leading-6 text-slate-700">
          No ecosystem listings published.
        </p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-300 p-4">
              <h2 className="font-semibold text-[#0C1833]">{entry.appName}</h2>
              <p className="text-sm leading-6 text-slate-700">
                Certification tier: {entry.certificationTier}
              </p>
              {entry.expiresAt ? (
                <p className="text-xs leading-5 text-slate-600">
                  Expires:{" "}
                  <time dateTime={entry.expiresAt.toISOString()}>
                    {expiryFormatter.format(entry.expiresAt)}
                  </time>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
