/** Minimal remittance types (Wave 7 expands reconciliation). */
export type RemittanceLineStatus =
  | "accepted"
  | "rejected"
  | "paid"
  | "partially_paid"
  | "unknown";

export type RemittanceLine = {
  externalLineReference: string | null;
  supportItemCode: string | null;
  amountRequestedCents: number | null;
  amountAcceptedCents: number | null;
  amountPaidCents: number | null;
  status: RemittanceLineStatus;
  externalStatusRaw?: string | null;
};
