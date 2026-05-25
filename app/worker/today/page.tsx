import Link from "next/link";

import { FieldModeShell } from "@/components/field/FieldModeShell";
import { BigActionButton } from "@/components/field/BigActionButton";
import { TodayScheduleCard } from "@/components/dashboard/TodayScheduleCard";
import { requireAuth } from "@/lib/auth/guards";

export const metadata = { title: "Today | MapAble Worker" };

export default async function WorkerTodayPage() {
  await requireAuth();

  return (
    <FieldModeShell title="Today's shift">
      <TodayScheduleCard
        items={[]}
        viewAllHref="/worker/shifts"
        emptyMessage="No shift assigned for today."
      />
      <div className="grid gap-3">
        <BigActionButton href="/worker/shifts" label="View shifts" variant="primary" />
        <BigActionButton
          href="/dashboard/incidents/new"
          label="Report safety issue"
          variant="secondary"
        />
      </div>
      <p className="text-sm text-muted-foreground">
        <Link href="/worker/shifts" className="text-primary underline">
          Open a shift
        </Link>{" "}
        to start, complete, or log service.
      </p>
    </FieldModeShell>
  );
}
