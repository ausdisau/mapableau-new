"use client";

export function SupportActivityLinker({ goalId }: { goalId: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Link bookings and service logs to goal {goalId} via the activity linker API.
    </p>
  );
}
