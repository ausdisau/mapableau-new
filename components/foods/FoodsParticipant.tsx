import Link from "next/link";

import { Button } from "@/components/ui/button";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  priceCents: number;
  dietaryTags?: string[];
  allergenTags?: string[];
  accessibilityTags?: string[];
};

export function FoodSearchBar() {
  return (
    <form className="grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_auto]" role="search">
      <label className="sr-only" htmlFor="food-search">Search foods</label>
      <input id="food-search" name="q" className="rounded-lg border px-3 py-2" placeholder="Search groceries, meals, dietary needs" />
      <Button type="submit" variant="default" size="default">Search</Button>
    </form>
  );
}

export function FoodProductCard({ product }: { product: Product }) {
  return (
    <article className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-orange-700">MapAble Foods</p>
      <h3 className="mt-1 text-lg font-bold text-slate-950">{product.title}</h3>
      {product.description ? <p className="mt-2 text-sm text-slate-600">{product.description}</p> : null}
      <p className="mt-3 font-semibold">${(product.priceCents / 100).toFixed(2)} AUD</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {(product.dietaryTags ?? []).map((tag) => <span key={tag} className="rounded-full bg-green-50 px-2 py-1 text-green-800">{tag}</span>)}
        {(product.accessibilityTags ?? []).map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-2 py-1 text-blue-800">{tag}</span>)}
      </div>
      <Button asChild variant="outline" size="sm" className="mt-4"><Link href={`/foods/products/${product.id}`}>View details</Link></Button>
    </article>
  );
}

export function AllergyProfileNotice({ allergens = [] }: { allergens?: string[] }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-labelledby="allergy-notice-title">
      <h2 id="allergy-notice-title" className="font-semibold text-amber-950">Allergy review required</h2>
      <p className="mt-1 text-sm text-amber-900">Review product allergen tags before checkout. Vendors only receive allergy details when consent allows it.</p>
      {allergens.length ? <p className="mt-2 text-sm text-amber-900">Profile allergens: {allergens.join(", ")}</p> : null}
    </section>
  );
}

export function FoodsHomePage() {
  const sampleProducts: Product[] = [
    { id: "sample-meal", title: "Accessible ready meal bundle", description: "Prepared meals with clear dietary tags and substitution options.", priceCents: 2400, dietaryTags: ["low sodium"], accessibilityTags: ["easy-open packaging"] },
    { id: "sample-grocery", title: "Weekly grocery essentials", description: "Household essentials with delivery handover instructions.", priceCents: 5600, dietaryTags: ["gluten-free options"] },
  ];
  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-orange-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Grocery + meal delivery</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Food ordering built for access needs</h1>
        <p className="mt-3 max-w-2xl text-slate-700">Browse accessible groceries and prepared meals, review allergy information, choose substitutions, and track delivery without exposing private address details publicly.</p>
      </section>
      <FoodSearchBar />
      <section className="grid gap-4 md:grid-cols-2" aria-label="Featured foods">
        {sampleProducts.map((product) => <FoodProductCard key={product.id} product={product} />)}
      </section>
    </div>
  );
}

export function FoodCart() {
  return (
    <section className="rounded-2xl border bg-white p-5">
      <h1 className="text-2xl font-bold">Your food cart</h1>
      <p className="mt-2 text-slate-600">Cart items preserve dietary and allergen snapshots so checkout is reviewed against the product you selected.</p>
      <FoodCartItem title="Example ready meal" quantity={2} amount="$24.00" />
      <Button asChild variant="default" size="default" className="mt-4"><Link href="/foods/checkout">Continue to checkout</Link></Button>
    </section>
  );
}

export function FoodCartItem({ title, quantity, amount }: { title: string; quantity: number; amount: string }) {
  return <div className="mt-4 flex items-center justify-between rounded-xl border p-3"><span>{title} x {quantity}</span><span>{amount}</span></div>;
}

export function DeliveryWindowSelector() {
  return (
    <fieldset className="grid gap-3 rounded-xl border p-4">
      <legend className="font-semibold">Delivery window</legend>
      <label className="grid gap-1 text-sm">Start<input type="datetime-local" name="deliveryWindowStart" className="rounded-lg border px-3 py-2" /></label>
      <label className="grid gap-1 text-sm">End<input type="datetime-local" name="deliveryWindowEnd" className="rounded-lg border px-3 py-2" /></label>
    </fieldset>
  );
}

export function DeliveryHandoverInstructions() {
  return <label className="grid gap-1 text-sm">Handover instructions<textarea name="deliveryInstructions" className="min-h-24 rounded-lg border px-3 py-2" placeholder="Door, intercom, support worker, or sensory preferences" /></label>;
}

export function FoodCheckoutForm() {
  return (
    <form className="space-y-5 rounded-2xl border bg-white p-5">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <label className="grid gap-1 text-sm">Delivery address<input name="deliveryAddressFull" className="rounded-lg border px-3 py-2" /></label>
      <DeliveryWindowSelector />
      <DeliveryHandoverInstructions />
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" name="allergenAcknowledged" className="mt-1" /> I have reviewed allergy and substitution details.</label>
      <Button type="submit" variant="default" size="default">Submit order</Button>
    </form>
  );
}

export function FoodOrderStatusTracker({ status = "submitted" }: { status?: string }) {
  const steps = ["submitted", "confirmed", "preparing", "packed", "out_for_delivery", "delivered"];
  return <ol className="grid gap-2" aria-label="Order status timeline">{steps.map((step) => <li key={step} className={step === status ? "font-bold text-orange-700" : "text-slate-600"}>{step.replace(/_/g, " ")}</li>)}</ol>;
}

export function FoodOrderTimeline() {
  return <section className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Timeline</h2><FoodOrderStatusTracker /></section>;
}

export function FoodOrderDetail({ orderId }: { orderId: string }) {
  return <div className="space-y-4"><h1 className="text-2xl font-bold">Food order {orderId}</h1><FoodOrderTimeline /><FoodDisputeForm /></div>;
}

export function FoodDisputeForm() {
  return <form className="rounded-2xl border bg-white p-5"><h2 className="font-semibold">Report a problem</h2><textarea className="mt-3 min-h-24 w-full rounded-lg border px-3 py-2" aria-label="Problem details" /><Button type="submit" variant="outline" size="default" className="mt-3">Submit for review</Button></form>;
}

export function FoodPreferencesForm() {
  return <form className="space-y-4 rounded-2xl border bg-white p-5"><h1 className="text-2xl font-bold">Food preferences</h1><label className="grid gap-1 text-sm">Dietary preferences<input className="rounded-lg border px-3 py-2" /></label><FoodSubstitutionPreferences /><Button type="submit" variant="default" size="default">Save preferences</Button></form>;
}

export function FoodSubstitutionPreferences() {
  return <label className="grid gap-1 text-sm">Substitution policy<select className="rounded-lg border px-3 py-2"><option>No substitutions</option><option>Contact me</option><option>Closest match</option><option>Provider choice</option></select></label>;
}
