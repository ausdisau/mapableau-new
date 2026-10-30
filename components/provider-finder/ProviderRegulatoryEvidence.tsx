import type { Provider } from "@/app/provider-finder/providers";
import {
  getProviderEvidence,
  NDIS_COMPLIANCE_ACTIONS_URL,
  NDIS_PROVIDER_REGISTER_URL,
  NDIS_WORKER_SCREENING_URL,
} from "@/lib/provider/finder/evidence";

type ProviderRegulatoryEvidenceProps = {
  provider: Provider;
};

/**
 * No private worker identifiers, screening status, or participant health data
 * enter this component. External checks are human initiated.
 */
export function ProviderRegulatoryEvidence({
  provider,
}: ProviderRegulatoryEvidenceProps) {
  const evidence = getProviderEvidence(provider);

  return (
    <details className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-foreground focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Source evidence and checks before engaging
      </summary>
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-foreground">Directory provenance</dt>
          <dd className="text-muted-foreground">{evidence.provenance}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Directory activity</dt>
          <dd className="text-muted-foreground">{evidence.directoryActivity}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">NDIS provider registration</dt>
          <dd className="text-muted-foreground">{evidence.registration}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Individual worker screening</dt>
          <dd className="text-muted-foreground">{evidence.workerScreening}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Accessibility and service fit</dt>
          <dd className="text-muted-foreground">{evidence.accessibility}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground">Availability and funding</dt>
          <dd className="text-muted-foreground">{evidence.availability}. {evidence.funding}.</dd>
        </div>
      </dl>
      {evidence.abn ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Directory ABN: <span className="font-medium text-foreground">{evidence.abn}</span>. Use it to check the legal entity, not an individual worker.
        </p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Imported provider-directory data is not a live registration, vacancy,
        competency or accessibility check. A registered provider does not prove
        an individual worker has a clearance.
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        <li>
          <a href={NDIS_PROVIDER_REGISTER_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Check the NDIS Commission Provider Register
          </a>
        </li>
        <li>
          <a href={NDIS_WORKER_SCREENING_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Learn how to verify worker screening through authorised access
          </a>
        </li>
        <li>
          <a href={NDIS_COMPLIANCE_ACTIONS_URL} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
            Search published compliance and enforcement actions
          </a>
        </li>
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        No matching public enforcement result does not establish a clean history,
        and a screening clearance does not prove competence or suitability.
      </p>
    </details>
  );
}
