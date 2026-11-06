import Link from "next/link";

export function TenantDisabled({ slug }: { slug?: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-semibold text-[#4B630C]">
        Tenant preview is not enabled
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[#243528]/80">
        {slug ? (
          <>
            Preview for <code>{slug}</code> requires{" "}
          </>
        ) : null}
        <code className="rounded bg-black/5 px-1.5 py-0.5 text-sm">
          MAPABLE_COVERAGE_CARE_ENABLED=true
        </code>
        . Flags default off. Proposed host{" "}
        <code>coveragecare.mapable.com.au</code> remains NOT CONFIGURED.
      </p>
      <p className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md bg-[#4B630C] px-4 text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#849F63]"
        >
          Return to MapAble
        </Link>
      </p>
    </div>
  );
}
