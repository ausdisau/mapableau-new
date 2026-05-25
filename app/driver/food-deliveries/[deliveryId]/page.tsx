import { DriverFoodDeliveryScreen } from "@/components/foods/FoodsOperations";

export default async function DriverFoodDeliveryPage({ params }: { params: Promise<{ deliveryId: string }> }) { const { deliveryId } = await params; return <DriverFoodDeliveryScreen deliveryId={deliveryId} />; }
