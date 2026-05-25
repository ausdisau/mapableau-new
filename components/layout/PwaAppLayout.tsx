import { AppShell } from "@/components/layout/AppShell";

export function PwaAppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
