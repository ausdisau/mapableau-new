export default async function TenantPrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-[color:var(--cc-olive)]">
        Privacy
      </h1>
      <p className="mt-3 text-base leading-relaxed text-[color:var(--cc-ink)]/80">
        This preview uses synthetic people and mock requests only. No real
        participant health records are stored. Marketing consent is separate from
        service-enquiry sharing consent and is independently revocable.
      </p>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-base text-[color:var(--cc-ink)]/80">
        <li>Hostname is branding context only — never authorisation.</li>
        <li>
          Sharing grants can be withdrawn; provider inbox access is revoked
          immediately in this synthetic store.
        </li>
        <li>
          No health or disability details in public metadata, ad scripts or
          analytics on tenant preview pages.
        </li>
        <li>
          Platform administrators do not automatically gain access to participant
          enquiry records.
        </li>
      </ul>
    </div>
  );
}
