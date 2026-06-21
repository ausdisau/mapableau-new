import { MapAbleAppShell } from "@/components/marketing/MapAbleAppShell";

export default function ShoppingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MapAbleAppShell variant="app" headerTitle="MapAble Shopping">
      {children}
    </MapAbleAppShell>
  );
}
