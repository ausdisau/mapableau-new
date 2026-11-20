type Tone = "info" | "attention" | "critical" | "success" | "neutral";

const TONE_LABEL: Record<Tone, string> = {
  info: "Information",
  attention: "Needs attention",
  critical: "Critical",
  success: "Success",
  neutral: "Status",
};

const TONE_COLOR: Record<Tone, string> = {
  info: "var(--mo-purple)",
  attention: "var(--mo-warning)",
  critical: "var(--mo-error)",
  success: "var(--mo-success)",
  neutral: "var(--mo-muted)",
};

type Props = {
  tone: Tone;
  label: string;
};

/** Text + icon status — never colour-only. */
export function OneStatus({ tone, label }: Props) {
  return (
    <span
      className="mo-chip"
      style={{ color: TONE_COLOR[tone] }}
      title={`${TONE_LABEL[tone]}: ${label}`}
    >
      <span className="mo-status-dot" aria-hidden="true" />
      <span className="sr-only">{TONE_LABEL[tone]}: </span>
      {label}
    </span>
  );
}
