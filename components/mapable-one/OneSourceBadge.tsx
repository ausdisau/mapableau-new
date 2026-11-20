type Props = {
  label: string;
};

export function OneSourceBadge({ label }: Props) {
  return (
    <span className="mo-chip mo-chip--wayfinding" title={`Data source: ${label}`}>
      Source: {label}
    </span>
  );
}
