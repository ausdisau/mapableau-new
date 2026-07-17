export function openDataLicenceAllowed(licence: string): boolean {
  const lower = licence.toLowerCase();
  return !lower.includes("internal") && !lower.includes("restricted");
}
