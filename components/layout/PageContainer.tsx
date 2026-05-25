import type { ReactNode } from "react";

interface PageContainerProps {
  title?: string;
  children: ReactNode;
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 overflow-x-hidden">
      {title ? (
        <h1 className="text-2xl font-semibold text-slate-900 mb-6">{title}</h1>
      ) : null}
      {children}
    </div>
  );
}
