import Link from "next/link";

export type VaultItemCardProps = {
  id: string;
  displayName: string;
  itemType: string;
  category: string;
  canonicalDomain: string;
  vaultTreatment: string;
  classification: string;
};

export function VaultItemCard(item: VaultItemCardProps) {
  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">
            <Link
              href={`/vault/items/${item.id}`}
              className="text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {item.displayName}
            </Link>
          </h2>
          <p className="text-sm text-muted-foreground">
            {item.canonicalDomain.replaceAll("_", " ")} ·{" "}
            {item.vaultTreatment.replaceAll("_", " ")}
          </p>
        </div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          <span className="sr-only">Classification: </span>
          {item.classification.replaceAll("_", " ")}
        </p>
      </div>
      <p className="mt-2 text-sm">
        Category: {item.category.replaceAll("_", " ")} · Type: {item.itemType}
      </p>
    </li>
  );
}
