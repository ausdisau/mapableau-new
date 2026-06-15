export function productPlaceholderImageUrl(title: string): string {
  const label = encodeURIComponent(title.slice(0, 40));
  return `https://placehold.co/600x400/e2e8f0/0C1833/png?text=${label}`;
}

export function getProductImageUrl(
  imageUrls: string[],
  title: string
): string {
  return imageUrls[0] ?? productPlaceholderImageUrl(title);
}
