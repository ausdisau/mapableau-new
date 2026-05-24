export function SafetyNotice({ children }: { children: React.ReactNode }) {
  return (
    <aside
      className="mapable-soft rounded-xl border border-mapable-blue/20 bg-mapable-soft p-4 text-sm text-slate-700"
      role="note"
    >
      {children}
    </aside>
  );
}
