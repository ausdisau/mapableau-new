"use client";

import { PlanOpsLiteClient } from "@/components/wedges/planops/PlanOpsLiteClient";

export default function PlanOpsLitePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">PlanOps Lite</h1>
        <p className="mt-1 text-muted-foreground">
          Organise service requests, invoices, and plan review notes in one place.
        </p>
      </header>
      <PlanOpsLiteClient />
    </div>
  );
}
