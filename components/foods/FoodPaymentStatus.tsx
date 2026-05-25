export function FoodPaymentStatus({
  status,
  totalCents,
  currency = "AUD",
}: {
  status: string;
  totalCents: number;
  currency?: string;
}) {
  return (
    <p className="text-sm">
      <span className="font-medium">Payment:</span>{" "}
      <span className="capitalize">{status.replace(/_/g, " ")}</span>
      {" — "}
      <span aria-label={`Total ${(totalCents / 100).toFixed(2)} ${currency}`}>
        ${(totalCents / 100).toFixed(2)} {currency}
      </span>
    </p>
  );
}
