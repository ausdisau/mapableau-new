"use client";

/**
 * Only render inside settings or after explicit user action — never on first load.
 */
export function NotificationPermissionPrompt({
  onEnable,
}: {
  onEnable: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-semibold">Enable push notifications</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        MapAble uses privacy-safe text on your lock screen. You choose which
        categories to receive.
      </p>
      <button
        type="button"
        className="mt-3 min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
        onClick={onEnable}
      >
        Turn on notifications
      </button>
    </div>
  );
}
