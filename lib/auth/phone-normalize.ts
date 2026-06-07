/**
 * Normalize phone numbers for Twilio Verify (E.164).
 * Defaults Australian local numbers (04…) to +61.
 */
export function normalizePhoneForTwilio(
  phone: string,
  defaultCountryCode = "61",
): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && defaultCountryCode === "61") {
    const national = digits.slice(1);
    if (national.length >= 8 && national.length <= 10) {
      return `+61${national}`;
    }
  }

  if (digits.startsWith(defaultCountryCode) && digits.length >= 10) {
    return `+${digits}`;
  }

  if (digits.length >= 8 && digits.length <= 10) {
    return `+${defaultCountryCode}${digits}`;
  }

  return null;
}
