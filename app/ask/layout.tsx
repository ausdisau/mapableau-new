import { CoreModuleLayout } from "@/lib/platform/layouts";

export const dynamic = "force-dynamic";

export default function AskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreModuleLayout>{children}</CoreModuleLayout>;
}
