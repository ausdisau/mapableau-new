export interface AccessibilityFinding {
  ok: boolean;
  code: string;
  message: string;
}

/**
 * Very small accessibility conformance surface: the participant-facing
 * federation UI must ship plain-language disclaimers and never require the
 * participant to interpret raw technical terms (like "verifiable credential")
 * without an in-context explanation.
 */
export function checkAccessibilityContract(input: {
  hasPlainLanguageDisclaimer: boolean;
  hasAmberFederationBanner: boolean;
  supportsScreenReaderLabels: boolean;
}): AccessibilityFinding[] {
  const findings: AccessibilityFinding[] = [];
  if (!input.hasPlainLanguageDisclaimer) {
    findings.push({
      ok: false,
      code: "a11y.disclaimer_missing",
      message:
        "participant-facing federation UI must display a plain-language disclaimer",
    });
  }
  if (!input.hasAmberFederationBanner) {
    findings.push({
      ok: false,
      code: "a11y.amber_banner_missing",
      message:
        "federation pages must display an amber banner: MapAble credentials are not government credentials",
    });
  }
  if (!input.supportsScreenReaderLabels) {
    findings.push({
      ok: false,
      code: "a11y.sr_labels_missing",
      message: "labels must be readable by screen readers",
    });
  }
  if (findings.length === 0) {
    findings.push({
      ok: true,
      code: "a11y.ok",
      message: "accessibility contract satisfied",
    });
  }
  return findings;
}
