import { DeliveryHandoverChecklist } from "@/components/foods/DeliveryHandoverChecklist";

export default async function DriverHandoverPage({
  params,
}: {
  params: Promise<{ deliveryId: string }>;
}) {
  const { deliveryId } = await params;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <DeliveryHandoverChecklist deliveryId={deliveryId} />
    </div>
  );
}
