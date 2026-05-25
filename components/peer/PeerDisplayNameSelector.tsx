"use client";

const MODES = [
  { value: "community_alias", label: "Community alias (recommended)" },
  { value: "first_name_only", label: "First name only" },
  { value: "anonymous_public", label: "Anonymous in community" },
  { value: "real_name", label: "Use my account name" },
] as const;

export function PeerDisplayNameSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">How you appear in MapAble Peer</legend>
      <ul className="mt-2 space-y-2">
        {MODES.map((m) => (
          <li key={m.value}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="radio"
                name="displayNameMode"
                value={m.value}
                checked={value === m.value}
                onChange={() => onChange(m.value)}
              />
              <span>{m.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}
