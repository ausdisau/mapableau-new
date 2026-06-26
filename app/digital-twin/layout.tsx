import { MapAbleCareMarketingShell } from "@/components/marketing/MapAbleCareMarketingShell";

export const dynamic = "force-dynamic";

export default function DigitalTwinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MapAbleCareMarketingShell>{children}</MapAbleCareMarketingShell>;
}
