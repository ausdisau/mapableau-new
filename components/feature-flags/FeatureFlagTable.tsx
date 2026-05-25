"use client";

import { FeatureFlagStatusBadge } from "./FeatureFlagStatusBadge";

type Flag = {
  id: string;
  key: string;
  name: string;
  enabled: boolean;
  killSwitch: boolean;
  rolloutPercentage: number;
  moduleArea: string | null;
};

export function FeatureFlagTable({
  flags,
  onToggle,
}: {
  flags: Flag[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Feature flags</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-2 pr-4">
              Key
            </th>
            <th scope="col" className="py-2 pr-4">
              Name
            </th>
            <th scope="col" className="py-2 pr-4">
              Status
            </th>
            <th scope="col" className="py-2 pr-4">
              Rollout %
            </th>
            <th scope="col" className="py-2">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <tr key={f.id} className="border-b border-border/60">
              <td className="py-3 pr-4 font-mono text-xs">{f.key}</td>
              <td className="py-3 pr-4">{f.name}</td>
              <td className="py-3 pr-4">
                <FeatureFlagStatusBadge enabled={f.enabled} killSwitch={f.killSwitch} />
              </td>
              <td className="py-3 pr-4">{f.rolloutPercentage}%</td>
              <td className="py-3">
                <button
                  type="button"
                  onClick={() => onToggle(f.id)}
                  className="min-h-11 rounded-lg border border-input px-3 hover:bg-muted"
                >
                  Toggle
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
