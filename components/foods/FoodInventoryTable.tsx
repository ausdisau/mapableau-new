"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";

export function FoodInventoryTable({
  rows,
}: {
  rows: Array<{ productId: string; title: string; quantityOnHand: number }>;
}) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Food inventory</caption>
      <thead>
        <tr className="border-b">
          <th scope="col">Product</th>
          <th scope="col">On hand</th>
          <th scope="col">Update</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.productId} className="border-b">
            <td>{r.title}</td>
            <td>{r.quantityOnHand}</td>
            <td>
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  await fetch("/api/provider/foods/inventory/update", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      productId: r.productId,
                      quantityOnHand: Number(fd.get("qty")),
                    }),
                  });
                }}
              >
                <input
                  name="qty"
                  type="number"
                  min={0}
                  defaultValue={r.quantityOnHand}
                  className={formInputClass}
                  aria-label={`Quantity for ${r.title}`}
                />
                <Button type="submit" variant="default" size="sm">
                  Save
                </Button>
              </form>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
