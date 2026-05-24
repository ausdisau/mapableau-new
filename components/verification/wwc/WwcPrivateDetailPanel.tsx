import { StatusBadge } from "@/components/ui/status-badge";

export function WwcPrivateDetailPanel({
  verification,
}: {
  verification: {
    id: string;
    jurisdiction: string;
    checkType: string;
    checkNumber: string;
    status: string;
    legalFirstName: string;
    legalLastName: string;
    expiresAt: Date | string | null;
    nextCheckAt: Date | string | null;
    reviewNotes: string | null;
    reviewedBy?: { name: string } | null;
    evidenceDocument?: { id: string; title: string } | null;
  };
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h2 className="font-semibold">WWC verification detail</h2>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Jurisdiction</dt>
          <dd>{verification.jurisdiction}</dd>
        </div>
        <div>
          <dt className="font-medium">Check type</dt>
          <dd>{verification.checkType.replace(/_/g, " ")}</dd>
        </div>
        <div>
          <dt className="font-medium">Check number</dt>
          <dd>{verification.checkNumber}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="font-medium">Status</dt>
          <dd>
            <StatusBadge status={verification.status} />
          </dd>
        </div>
        <div>
          <dt className="font-medium">Legal name</dt>
          <dd>
            {verification.legalFirstName} {verification.legalLastName}
          </dd>
        </div>
        {verification.expiresAt ? (
          <div>
            <dt className="font-medium">Expires</dt>
            <dd>{new Date(verification.expiresAt).toLocaleDateString("en-AU")}</dd>
          </div>
        ) : null}
        {verification.reviewedBy ? (
          <div>
            <dt className="font-medium">Reviewed by</dt>
            <dd>{verification.reviewedBy.name}</dd>
          </div>
        ) : null}
      </dl>
      {verification.reviewNotes ? (
        <p className="text-sm text-muted-foreground">{verification.reviewNotes}</p>
      ) : null}
      {verification.evidenceDocument ? (
        <p className="text-sm">
          Evidence: {verification.evidenceDocument.title} (document ID{" "}
          {verification.evidenceDocument.id}) — access via secure documents only.
        </p>
      ) : null}
    </section>
  );
}
