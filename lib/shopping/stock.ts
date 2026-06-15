export function isProductInStock(stockQuantity: number | null): boolean {
  if (stockQuantity == null) return true;
  return stockQuantity > 0;
}

export function getStockLabel(stockQuantity: number | null): string {
  if (stockQuantity == null) return "In stock";
  if (stockQuantity === 0) return "Out of stock";
  if (stockQuantity <= 5) return `Only ${stockQuantity} left`;
  return "In stock";
}

export function getStockBadgeClass(stockQuantity: number | null): string {
  if (!isProductInStock(stockQuantity)) {
    return "bg-red-100 text-red-800";
  }
  if (stockQuantity != null && stockQuantity <= 5) {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-emerald-100 text-emerald-800";
}
