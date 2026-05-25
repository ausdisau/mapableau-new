export function ServiceAgreementPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
      Service agreement details are shown as a placeholder in this MVP and must
      be reviewed before billing or claiming.
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ServiceAgreementPlaceholder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Service agreement placeholder</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Agreement details will be linked here before services move beyond the MVP
        pilot. This screen does not make any NDIS funding approval claims.
      </CardContent>
    </Card>
  );
}
