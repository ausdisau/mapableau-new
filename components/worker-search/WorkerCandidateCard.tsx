import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type WorkerMarketplaceCandidate } from "@/lib/search/worker-search-types";

function formatVerification(status: string | null) {
  if (!status) return "unknown";
  return status.replaceAll("_", " ");
}

export function WorkerCandidateCard({
  candidate,
}: {
  candidate: WorkerMarketplaceCandidate;
}) {
  const verificationVariant =
    candidate.verificationStatus === "verified" ? "default" : "outline";

  return (
    <Card variant="outlined">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{candidate.displayName}</CardTitle>
          <Badge variant="secondary">
            {candidate.kind === "worker" ? "Worker" : "Provider"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge variant={verificationVariant}>
            {formatVerification(candidate.verificationStatus)}
          </Badge>
          {typeof candidate.score === "number" ? (
            <Badge variant="outline">Score {candidate.score}</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {candidate.summary ? (
          <p className="text-muted-foreground">{candidate.summary}</p>
        ) : (
          <p className="text-muted-foreground">
            No summary provided for this candidate.
          </p>
        )}
        <MetaRow label="Service types" values={candidate.serviceTypes} />
        <MetaRow label="Regions" values={candidate.serviceRegions} />
        <MetaRow label="Languages" values={candidate.languages} />
      </CardContent>
    </Card>
  );
}

function MetaRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {values.length === 0 ? (
        <p className="text-xs text-muted-foreground">Not specified</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <Badge key={`${label}-${value}`} variant="outline">
              {value}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
