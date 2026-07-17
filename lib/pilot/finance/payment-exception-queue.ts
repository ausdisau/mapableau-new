export type PaymentException = {
  id: string;
  reason: string;
  amountCents: number;
  status: "open" | "resolved";
};

export function sortPaymentExceptions(
  items: readonly PaymentException[]
): PaymentException[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.amountCents - a.amountCents;
  });
}
