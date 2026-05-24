import { normalizeAbnDigits } from "@/lib/abn-lookup/format-abn";

const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19] as const;

export type AbnValidationResult =
  | { valid: true; digits: string }
  | { valid: false; reason: string };

/** Australian Business Number checksum (modulo 89). */
export function validateAbnChecksum(abn: string): AbnValidationResult {
  const digits = normalizeAbnDigits(abn);
  if (digits.length !== 11) {
    return { valid: false, reason: "ABN must be 11 digits" };
  }
  if (!/^\d{11}$/.test(digits)) {
    return { valid: false, reason: "ABN must contain only digits" };
  }

  const nums = digits.split("").map((d) => Number(d));
  nums[0] -= 1;

  let sum = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    sum += nums[i]! * WEIGHTS[i]!;
  }

  if (sum % 89 !== 0) {
    return { valid: false, reason: "ABN checksum invalid" };
  }

  return { valid: true, digits };
}
