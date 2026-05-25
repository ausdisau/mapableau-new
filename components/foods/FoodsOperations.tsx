import Link from "next/link";

import { Button } from "@/components/ui/button";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-white p-5"><h2 className="text-lg font-bold">{title}</h2><div className="mt-3 text-sm text-slate-700">{children}</div></section>;
}

export function FoodVendorDashboard() {
  return <div className="grid gap-4 md:grid-cols-2"><Card title="Order queue"><p>Review submitted orders, confirm preparation, and dispatch deliveries.</p><Button asChild variant="default" size="sm" className="mt-3"><Link href="/provider/foods/orders">Open orders</Link></Button></Card><Card title="Catalogue"><p>Manage grocery, meal, and household essential products.</p><Button asChild variant="outline" size="sm" className="mt-3"><Link href="/provider/foods/products">Manage products</Link></Button></Card></div>;
}

export function FoodProductForm() {
  return <form className="space-y-4 rounded-2xl border bg-white p-5"><h1 className="text-2xl font-bold">Food product</h1><label className="grid gap-1 text-sm">Title<input className="rounded-lg border px-3 py-2" /></label><label className="grid gap-1 text-sm">Price cents<input type="number" className="rounded-lg border px-3 py-2" /></label><Button type="submit" variant="default" size="default">Save product</Button></form>;
}

export function FoodInventoryTable() {
  return <Card title="Inventory"><table className="w-full text-left"><thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead><tbody><tr><td>Example meal</td><td>24</td><td>Published</td></tr></tbody></table></Card>;
}

export function FoodOrderQueue() {
  return <Card title="Food order queue"><ul className="space-y-2"><li className="rounded-xl border p-3">Submitted order - allergy review required - NDIS review required</li><li className="rounded-xl border p-3">Packed order - ready for dispatch</li></ul></Card>;
}

export function FoodDeliveryAssignmentPanel() {
  return <Card title="Delivery assignments"><p>Assign drivers and update dispatch status without exposing participant details beyond authorised roles.</p><Button variant="default" size="sm" className="mt-3">Assign driver</Button></Card>;
}

export function DriverFoodDeliveryScreen({ deliveryId = "delivery" }: { deliveryId?: string }) {
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Food delivery {deliveryId}</h1><Card title="Route privacy"><p>Show route approximation and handover instructions. Public tracking exposes status and suburb only.</p></Card><DeliveryHandoverChecklist /></div>;
}

export function DeliveryHandoverChecklist() {
  return <form className="space-y-3 rounded-2xl border bg-white p-5"><h2 className="font-bold">Handover checklist</h2><label className="flex gap-2"><input type="checkbox" /> Order handed to participant or authorised support person</label><label className="flex gap-2"><input type="checkbox" /> Temperature and packaging checked</label><label className="grid gap-1 text-sm">Notes<textarea className="rounded-lg border px-3 py-2" /></label><Button type="submit" variant="default" size="default">Record handover</Button></form>;
}

export function FoodInvoicePanel() {
  return <Card title="Food invoices"><p>Line items are separated by food, preparation, delivery, and support time. Badge: NDIS review required.</p><span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">NDIS review required</span></Card>;
}

export function FoodPaymentStatus() {
  return <Card title="Payment status"><p>Stripe Checkout placeholder only. Card details are never stored in MapAble.</p></Card>;
}

export function FoodSafetyIssueReport() {
  return <Card title="Food safety"><p>Track allergy, contamination, delivery temperature, and handover concerns for admin review.</p></Card>;
}

export function FamilyFoodApprovals() {
  return <Card title="Family approvals"><p>Nominees can review orders when delegated consent and permissions allow it.</p></Card>;
}

export function AdminFoodsDashboard() {
  return <div className="grid gap-4 md:grid-cols-2"><FoodOrderQueue /><FoodSafetyIssueReport /><FoodInvoicePanel /><FoodPaymentStatus /></div>;
}
