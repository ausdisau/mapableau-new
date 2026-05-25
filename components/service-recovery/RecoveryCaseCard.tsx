import Link from "next/link";

export function RecoveryCaseCard({
  caseRecord,
}: {
  caseRecord: {
    id: string;
    summary: string;
    status: string;
    trigger: string;
  };
}) {
  return (
    <Link
      href={`/service-recovery/${caseRecord.id}`}
      className="block rounded-xl border border-border p-4 hover:bg-muted/50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring"
    >
      <h2 className="font-medium">{caseRecord.summary}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Status: {caseRecord.status.replace(/_/g, " ")}
      </p>
    </Link>
  );
}
