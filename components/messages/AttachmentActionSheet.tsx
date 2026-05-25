"use client";

export function AttachmentActionSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const actions = ["Photo", "Document", "Voice note (coming soon)"];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close attachments"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Add attachment"
        className="relative rounded-t-2xl bg-card p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
      >
        <ul className="space-y-2">
          {actions.map((label) => (
            <li key={label}>
              <button
                type="button"
                className="min-h-11 w-full rounded-lg border border-border px-4 text-left font-medium"
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
