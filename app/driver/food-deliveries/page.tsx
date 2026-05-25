import Link from "next/link";

export default function DriverFoodDeliveriesPage() { return <section className="rounded-2xl border bg-white p-5"><h1 className="text-2xl font-bold">Food deliveries</h1><Link className="mt-3 inline-block font-semibold text-orange-700" href="/driver/food-deliveries/sample-delivery">Open assigned delivery</Link></section>; }