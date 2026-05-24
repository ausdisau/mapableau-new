import { CoreShell } from "@/components/core/CoreShell";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <CoreShell>
      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-10">
        {children}
      </div>
    </CoreShell>
  );
}
