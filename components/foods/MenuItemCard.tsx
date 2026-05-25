type MenuItemCardProps = {
  item: {
    id: string;
    name: string;
    description?: string | null;
    textureLevel: string;
    allergens?: { allergy: { label: string } }[];
  };
  quantity: number;
  onQuantityChange: (qty: number) => void;
};

export function MenuItemCard({
  item,
  quantity,
  onQuantityChange,
}: MenuItemCardProps) {
  const allergenLabels =
    item.allergens?.map((a) => a.allergy.label).join(", ") ?? "None listed";

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-medium">{item.name}</h3>
      {item.description ? (
        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">
        Texture: {item.textureLevel.replace(/_/g, " ")} · Allergens:{" "}
        {allergenLabels}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor={`qty-${item.id}`} className="text-sm">
          Quantity
        </label>
        <input
          id={`qty-${item.id}`}
          type="number"
          min={0}
          max={20}
          value={quantity}
          onChange={(e) => onQuantityChange(Number(e.target.value))}
          className="min-h-10 w-20 rounded-lg border border-border px-2"
        />
      </div>
    </article>
  );
}
