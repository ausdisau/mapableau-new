/** Format ABN as XX XXX XXX XXX (Australian standard). */
export function formatAbn(abn: string): string {
  const digits = abn.replace(/\D/g, "");
  if (digits.length !== 11) return abn;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}

/** Strip to 11 digits for API and storage. */
export function normalizeAbnDigits(abn: string): string {
  return abn.replace(/\D/g, "");
}
