import { AccessibleRoutePlanner } from "@/components/navigate/AccessibleRoutePlanner";

export default function NavigatePage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">MapAble Navigate</h1>
      <p className="text-muted-foreground">
        Plan routes with accessibility warnings. MapAble does not guarantee access
        unless a segment is verified.
      </p>
      <AccessibleRoutePlanner />
    </main>
  );
}
