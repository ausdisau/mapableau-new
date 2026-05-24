"use client";

import { ALL_NOMINEE_SCOPES, scopeLabel } from "@/lib/family/family-permission-policy";
import type { NomineePermissionScope } from "@prisma/client";

import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";

export function FamilyPermissionSelector({
  linkId,
  selected,
  onChange,
}: {
  linkId: string;
  selected: NomineePermissionScope[];
  onChange?: (scopes: NomineePermissionScope[]) => void;
  readOnly?: boolean;
}) {
  return (
    <MapAbleCard
      title="Permission scope"
      description="Granular permissions can be revoked at any time by the participant."
    >
      <fieldset>
        <legend className="sr-only">Nominee permissions for link {linkId}</legend>
        <ul className="space-y-3">
          {ALL_NOMINEE_SCOPES.map((scope) => (
            <li key={scope}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={selected.includes(scope)}
                  onChange={(e) => {
                    if (!onChange) return;
                    onChange(
                      e.target.checked
                        ? [...selected, scope]
                        : selected.filter((s) => s !== scope)
                    );
                  }}
                  className="size-5"
                />
                <span className="text-sm">{scopeLabel(scope)}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </MapAbleCard>
  );
}
