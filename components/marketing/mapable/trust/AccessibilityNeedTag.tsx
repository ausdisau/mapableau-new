export function AccessibilityNeedTag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700">
      {label}
    </span>
  );
}
