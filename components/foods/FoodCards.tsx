import Link from "next/link";

import type {
  FoodDeliveryAssignment,
  FoodOrder,
  FoodOrderEvent,
  FoodOrderItem,
  FoodProduct,
  FoodVendor,
} from "@prisma/client";

import { plainLanguageDeliveryStatus } from "@/lib/foods/delivery-service";

export function Money({ cents }: { cents: number }) {
  return <span>${(cents / 100).toFixed(2)}</span>;
}

export function AllergyProfileNotice({ allergens }: { allergens: string[] }) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950">
      <strong>Allergy review required.</strong>{" "}
      {allergens.length
        ? `Your saved allergens include ${allergens.join(", ")}. Confirm this before checkout.`
        : "Add allergies in preferences so vendors only see what you consent to share."}
    </div>
  );
}

export function FoodProductCard({
  product,
}: {
  product: FoodProduct & { vendor?: FoodVendor | null };
}) {
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm">
      <p className="text-xs uppercase text-muted-foreground">
        {product.productType.replace(/_/g, " ")}
      </p>
      <h3 className="mt-2 font-heading text-lg font-semibold">{product.title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {product.dietaryTags.map((tag) => (
          <span key={tag} className="rounded-full bg-orange-100 px-2 py-1 text-orange-950">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <strong>
          <Money cents={product.priceCents} />
        </strong>
        <Link href={`/foods/products/${product.id}`} className="text-primary hover:underline">
          View details
        </Link>
      </div>
    </article>
  );
}

export function MealProductCard(props: Parameters<typeof FoodProductCard>[0]) {
  return <FoodProductCard {...props} />;
}

export function FoodOrderStatusTracker({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function FoodOrderTimeline({
  events,
}: {
  events: FoodOrderEvent[];
}) {
  return (
    <ol className="space-y-3">
      {events.map((event) => (
        <li key={event.id} className="rounded-xl border p-3">
          <p className="font-medium">{event.toStatus.replace(/_/g, " ")}</p>
          {event.message ? <p className="text-sm text-muted-foreground">{event.message}</p> : null}
        </li>
      ))}
    </ol>
  );
}

export function FoodOrderDetail({
  order,
}: {
  order: FoodOrder & {
    items: FoodOrderItem[];
    vendor: FoodVendor;
    assignment?: FoodDeliveryAssignment | null;
  };
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">{order.vendor.displayName}</h2>
            <p className="text-sm text-muted-foreground">
              Delivery to {order.deliveryAddressSuburb ?? "selected suburb"}
            </p>
          </div>
          <FoodOrderStatusTracker status={order.status} />
        </div>
        <ul className="mt-4 divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between py-2 text-sm">
              <span>{item.titleSnapshot}</span>
              <Money cents={item.totalCents} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right font-semibold">
          Total: <Money cents={order.totalCents} />
        </p>
        <p className="mt-2 text-xs text-muted-foreground">NDIS review required. Not marked claimable.</p>
      </div>
      {order.assignment ? (
        <p className="rounded-xl border p-4 text-sm">
          Delivery: {plainLanguageDeliveryStatus(order.assignment.status)}
        </p>
      ) : null}
    </section>
  );
}

export function FoodPaymentStatus({ status }: { status: string }) {
  return <span>{status.replace(/_/g, " ")}</span>;
}

export function FoodInvoicePanel({
  items,
}: {
  items: Array<{ description: string; totalCents: number }>;
}) {
  return (
    <div className="rounded-2xl border p-4">
      <h3 className="font-semibold">Invoice placeholder</h3>
      <p className="text-sm text-muted-foreground">NDIS review required.</p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.description} className="flex justify-between text-sm">
            <span>{item.description}</span>
            <Money cents={item.totalCents} />
          </li>
        ))}
      </ul>
    </div>
  );
}
