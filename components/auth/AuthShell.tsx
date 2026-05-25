import type { ReactNode } from "react";

import { SkipToContent } from "@/components/layout/SkipToContent";

interface AuthShellProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SkipToContent />
      <main
        id="main-content"
        className="flex-1 flex flex-col items-center justify-center px-4 py-10 safe-area-pb"
      >
        <div className="w-full max-w-md">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
            {description ? (
              <p className="mt-2 text-slate-600 text-base">{description}</p>
            ) : null}
          </header>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
