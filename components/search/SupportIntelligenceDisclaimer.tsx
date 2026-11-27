import { hardDenyOperationalActions } from "@/lib/support-intelligence/config/feature-flags";

/**
 * Accessible disclosure for Support Intelligence v0.1 on Search surfaces.
 * WCAG 2.2 AA: semantic region, clear language, keyboard reachable links.
 */
export function SupportIntelligenceDisclaimer({
  enabled,
}: {
  enabled: boolean;
}) {
  if (!enabled) return null;
  const ops = hardDenyOperationalActions();

  return (
    <aside
      className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-[#0C1833]"
      aria-labelledby="si-disclaimer-heading"
      role="note"
    >
      <h2 id="si-disclaimer-heading" className="font-heading text-base font-bold">
        Support Intelligence (preview)
      </h2>
      <p className="mt-2 leading-relaxed">
        Matches use directory evidence and your consented self-reported needs.
        Registration, worker screening, vacancies and funding stay{" "}
        <strong>unknown</strong> until independently confirmed. MapAble does not
        decide NDIS eligibility.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>Booking: {ops.booking ? "available" : "disabled"}</li>
        <li>Payment: {ops.payment ? "available" : "disabled"}</li>
        <li>Autonomous dispatch: {ops.dispatch ? "available" : "disabled"}</li>
      </ul>
      <p className="mt-2">
        <a
          className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005B7F]"
          href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider"
          rel="noreferrer"
        >
          Check the official NDIS Commission Provider Register
        </a>
      </p>
    </aside>
  );
}
