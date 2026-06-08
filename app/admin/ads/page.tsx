import { AdminAdsClient } from "@/components/admin/AdminAdsClient";

export const metadata = {
  title: "Ads manager | Admin",
};

export default function AdminAdsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Ads manager</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review paid campaigns before they go live. All ads must be accessible and
          policy-compliant.
        </p>
      </header>
      <AdminAdsClient />
    </div>
  );
}
