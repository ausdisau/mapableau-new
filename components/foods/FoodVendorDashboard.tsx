import Link from "next/link";

export function FoodVendorDashboard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[
        { href: "/provider/foods/products", label: "Products" },
        { href: "/provider/foods/orders", label: "Orders" },
        { href: "/provider/foods/inventory", label: "Inventory" },
        { href: "/provider/foods/delivery", label: "Delivery" },
        { href: "/provider/foods/payments", label: "Payments" },
      ].map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-xl border p-6 font-medium hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
