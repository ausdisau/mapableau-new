export function validateTransferWindow(
  minutesAvailable: number,
  requiredMinutes: number,
): { valid: boolean; reason: string } {
  return minutesAvailable >= requiredMinutes
    ? { valid: true, reason: "transfer_window_ok" }
    : { valid: false, reason: "transfer_window_too_short" };
}
