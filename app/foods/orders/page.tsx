import Link from "next/link";

import { FoodOrderStatusTracker } from "@/components/foods/FoodsParticipant";

export default function FoodOrdersPage() {
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Food orders</h1><article className="rounded-2xl border bg-white p-5"><Link className="font-semibold" href="/foods/orders/sample-order">Sample order</Link><FoodOrderStatusTracker /></article></div>;
}