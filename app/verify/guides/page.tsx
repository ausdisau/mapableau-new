import type { Metadata } from "next";

import { GuideComposerClient } from "@/components/access-intelligence/guide-composer-client";

export const metadata: Metadata = {
  title: "Access guides | MapAble Verify",
  description: "Versioned accessible venue guides bound to approved evidence.",
};

export default function VerifyGuidesPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Venue access guides</h1>
      <p className="mt-3">
        Draft, review, and publish guides where every factual sentence links to
        provenance.
      </p>
      <div className="mt-6">
        <GuideComposerClient />
      </div>
    </main>
  );
}
