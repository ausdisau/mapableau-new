import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function OnePrivacyNote({ children }: Props) {
  return (
    <aside
      className="mo-card border-l-4 border-l-[var(--mo-purple)] p-4 text-sm text-[var(--mo-muted)]"
      role="note"
    >
      <p className="font-semibold text-[var(--mo-ink)]">Privacy note</p>
      <div className="mt-1">{children}</div>
    </aside>
  );
}
