import { FoodOrderDetail } from "@/components/foods/FoodsParticipant";

export default async function FoodOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <FoodOrderDetail orderId={orderId} />;
}