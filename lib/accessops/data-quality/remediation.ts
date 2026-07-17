export function remediationRequired(errors: string[]): boolean {
  return errors.length > 0;
}
