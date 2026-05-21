import { format } from "date-fns";

export function formatAudCents(cents: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(cents / 100);
}

export function formatInvoiceDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMM yyyy");
}

export function formatInvoiceStatus(status: string): string {
  return status.replace(/_/g, " ");
}
