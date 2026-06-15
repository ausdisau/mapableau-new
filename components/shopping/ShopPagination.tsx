import Link from "next/link";

type ShopPaginationProps = {
  page: number;
  totalPages: number;
  q?: string;
  category?: string;
};

function buildHref(page: number, q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/shopping?${query}` : "/shopping";
}

export function ShopPagination({
  page,
  totalPages,
  q,
  category,
}: ShopPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Product pagination"
      className="mt-8 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={buildHref(page - 1, q, category)}
            className="min-h-11 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link
            href={buildHref(page + 1, q, category)}
            className="min-h-11 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Next
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
