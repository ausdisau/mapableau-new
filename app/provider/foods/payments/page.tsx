export default function ProviderFoodPaymentsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="text-muted-foreground">
        Stripe Connect and payout status integrate with MapAble billing. Food payments are linked
        per order — no card data stored in MapAble.
      </p>
    </div>
  );
}
