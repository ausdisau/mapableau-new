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

export default async function ShoppingOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isShoppingEnabled()) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const order = await getOrderForUser(id, session.user.id);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <ShoppingNav />
      <header className="mt-6 space-y-2">
        <h1 className="text-3xl font-semibold">Order confirmation</h1>
        <p className="text-muted-foreground">
          Order {order.id.slice(0, 8)} · {order.status.replace(/_/g, " ")}
        </p>
      </header>

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

      <div className="mt-6">
        <ShoppingSafetyNotice compact />
      </div>
    </div>
  );
}
