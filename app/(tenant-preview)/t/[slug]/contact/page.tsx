import Link from "next/link";

import { COVERAGE_CARE_BRAND } from "@/lib/tenancy/coverage-care-brand";

export default async function TenantContactPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Contact
      </h1>
      <p className="mt-3 text-base text-[color:var(--cc-ink)]/80">
        Human-support fallback for the synthetic {COVERAGE_CARE_BRAND.name}{" "}
        preview. Voice calls are never required. AAC text-only paths are
        supported via the enquiry form.
      </p>
      <ul className="mt-6 space-y-3 text-base">
        <li>
          Synthetic support mailbox:{" "}
          <a
            className="underline underline-offset-4"
            href="mailto:support.demo@coveragecare.example"
          >
            support.demo@coveragecare.example
          </a>{" "}
          (not monitored — demo only)
        </li>
        <li>
          Create a synthetic enquiry:{" "}
          <Link
            href={`/t/${slug}/enquire`}
            className="underline underline-offset-4"
          >
            /t/{slug}/enquire
          </Link>
        </li>
        <li>
          MapAble platform help:{" "}
          <Link href="https://mapable.com.au" className="underline underline-offset-4">
            mapable.com.au
          </Link>
        </li>
      </ul>
    </div>
  );
}
