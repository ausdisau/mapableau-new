"use client";

import { Button } from "@/components/ui/button";

export function FoodCartItem({
  id,
  title,
  quantity,
  unitPrice,
  onUpdate,
  onRemove,
  busy,
}: {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
  busy?: boolean;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          ${(unitPrice / 100).toFixed(2)} each — ${((unitPrice * quantity) / 100).toFixed(2)} total
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Decrease quantity of ${title}`}
          disabled={busy || quantity <= 1}
          onClick={() => onUpdate(quantity - 1)}
        >
          −
        </Button>
        <span aria-live="polite" className="min-w-[2ch] text-center font-medium">
          {quantity}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Increase quantity of ${title}`}
          disabled={busy}
          onClick={() => onUpdate(quantity + 1)}
        >
          +
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={`Remove ${title} from cart`}
          disabled={busy}
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}
