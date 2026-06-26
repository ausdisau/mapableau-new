import { Button } from "@/components/ui/button";

export type AccessibilitySettings = {
  highContrastMode: boolean;
  largeTouchTargets: boolean;
  reducedMotion: boolean;
  showReasoningSummary: boolean;
};

type AccessibilitySettingsPanelProps = {
  settings: AccessibilitySettings;
  onChange: (settings: AccessibilitySettings) => void;
  onSave: () => void;
  saved?: boolean;
};

export function AccessibilitySettingsPanel({
  settings,
  onChange,
  onSave,
  saved = false,
}: AccessibilitySettingsPanelProps) {
  return (
    <>
      <fieldset className="mt-6 space-y-4">
        <legend className="sr-only">Accessibility options</legend>
        {(
          [
            ["highContrastMode", "High contrast mode"],
            ["largeTouchTargets", "Large touch targets"],
            ["reducedMotion", "Reduced motion"],
            ["showReasoningSummary", "Show short reasoning summaries"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-11 items-center gap-3">
            <input
              type="checkbox"
              checked={settings[key]}
              onChange={(e) =>
                onChange({ ...settings, [key]: e.target.checked })
              }
              className="h-5 w-5"
            />
            {label}
          </label>
        ))}
      </fieldset>
      <Button
        type="button"
        variant="default"
        size="default"
        className="mt-6 min-h-11"
        onClick={onSave}
      >
        Save settings
      </Button>
      {saved ? (
        <p role="status" className="mt-2 text-sm text-green-700">
          Settings saved.
        </p>
      ) : null}
    </>
  );
}
