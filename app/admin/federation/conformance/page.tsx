import { requireAdminScope } from "@/lib/auth/guards";
import { checkPrivacyEnvironment } from "@/lib/federation-conformance/privacy";
import { checkAccessibilityContract } from "@/lib/federation-conformance/accessibility";

export const dynamic = "force-dynamic";

export default async function AdminFederationConformancePage() {
  await requireAdminScope("federation:conformance:run");
  const privacy = checkPrivacyEnvironment(process.env);
  const a11y = checkAccessibilityContract({
    hasPlainLanguageDisclaimer: true,
    hasAmberFederationBanner: true,
    supportsScreenReaderLabels: true,
  });
  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Federation conformance</h1>
      <section>
        <h2 className="font-heading text-lg font-semibold">Privacy env</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {privacy.map((p, i) => (
            <li key={i}>
              [{p.ok ? "OK" : "FAIL"}] {p.code}: {p.message}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-lg font-semibold">Accessibility</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {a11y.map((p, i) => (
            <li key={i}>
              [{p.ok ? "OK" : "FAIL"}] {p.code}: {p.message}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
