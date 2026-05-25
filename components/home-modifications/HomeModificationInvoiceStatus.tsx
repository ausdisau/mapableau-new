import { MapAbleCard, MapAbleStatusBadge } from "@/components/shared/MapAbleModuleUi";

export function HomeModificationInvoiceStatus({
  invoiceId,
  status,
}: {
  invoiceId?: string | null;
  status?: string;
}) {
  return (
    <MapAbleCard title="Invoice & payment status">
      {!invoiceId ? (
        <p className="text-sm text-muted-foreground">
          No invoice linked yet. An invoice can be generated when a quote is accepted.
        </p>
      ) : (
        <>
          <p className="text-sm">Invoice ID: {invoiceId.slice(0, 12)}…</p>
          <p className="mt-2">
            <MapAbleStatusBadge status={status ?? "invoice_pending"} />
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Plan manager review available where consent exists.
          </p>
        </>
      )}
    </MapAbleCard>
  );
}
