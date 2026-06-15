import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { ShoppingNav } from "@/components/shopping/ShoppingNav";
import { ShoppingSafetyNotice } from "@/components/shopping/ShoppingSafetyNotice";
import { isShoppingEnabled } from "@/lib/config/shopping";
import { formatShopMoney } from "@/lib/shopping/format";
import { getOrderForUser } from "@/lib/shopping/order-service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return {
    title: "Order confirmation | MapAble Shopping",
  };
}

type SearchParams = Promise<{ checkout?: string }>;

export default async function ShoppingOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  if (!isShoppingEnabled()) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const order = await getOrderForUser(id, session.user.id);
  if (!order) notFound();

  const showSuccessBanner = query.checkout === "success";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <ShoppingNav />
      <header className="mt-6 space-y-2">
        <h1 className="text-3xl font-semibold">Order confirmation</h1>
        <p className="text-muted-foreground">
          Order {order.id.slice(0, 8)} · {order.status.replace(/_/g, " ")}
        </p>
      </header>

      {showSuccessBanner ? (
        <div
          className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-950"
          role="status"
        >
          <p className="font-medium">Payment received — thank you for your order.</p>
          <p className="mt-1 text-sm">
            Your invoice is available below for your records. MapAble does not
            guarantee NDIS funding approval.
          </p>
        </div>
      ) : null}

      <section className="mt-8 space-y-4 rounded-lg border border-border p-4">
        <p className="text-lg font-medium">
          Total: {formatShopMoney(order.totalCents, order.currency)}
        </p>
        <ul className="space-y-2 text-sm">
          {order.lineItems.map((item) => (
            <li key={`${item.description}-${item.unitAmountCents}`}>
              {item.description} × {item.quantity} —{" "}
              {formatShopMoney(item.totalCents, order.currency)}
            </li>
          ))}
        </ul>
        {order.shippingName ? (
          <p className="text-sm text-muted-foreground">
            Ship to: {order.shippingName}
          </p>
        ) : null}
        {order.fundingSource ? (
          <p className="text-sm text-muted-foreground">
            Funding: {order.fundingSource.label} ({order.fundingSource.type})
          </p>
        ) : null}
        <Link
          href={`/dashboard/billing/invoices/${order.billingInvoiceId}`}
          className="inline-block text-sm underline"
        >
          View invoice evidence
        </Link>
      </section>

      <p className="mt-4 text-sm">
        <Link href="/shopping/orders" className="underline">
          View all orders
        </Link>
      </p>

      <div className="mt-6">
        <ShoppingSafetyNotice compact />
      </div>
    </div>
  );
}
