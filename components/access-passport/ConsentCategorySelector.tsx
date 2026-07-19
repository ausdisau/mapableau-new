"use client";

import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  ACCESS_SHARE_CATEGORIES,
  ACCESS_SHARE_CATEGORY_LABELS,
  type AccessShareCategory,
} from "@/types/access-passport";

export function ConsentCategorySelector({
  value,
  onChange,
}: {
  value: AccessShareCategory[];
  onChange: (next: AccessShareCategory[]) => void;
}) {
  function toggle(category: AccessShareCategory) {
    if (value.includes(category)) {
      onChange(value.filter((item) => item !== category));
    } else {
      onChange([...value, category]);
    }
  }

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-black text-[#0C1833]">
        Categories you choose to share
      </legend>
      <p className="text-sm text-slate-600">
        Private display settings (text size, contrast, motion) are never included.
        Share only functional access requirements you select here.
      </p>
      <div className="grid gap-2">
        {ACCESS_SHARE_CATEGORIES.map((category) => (
          <label
            key={category}
            className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 ${mapableCareFocusRing}`}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={value.includes(category)}
              onChange={() => toggle(category)}
            />
            <span className="text-sm font-semibold text-[#0C1833]">
              {ACCESS_SHARE_CATEGORY_LABELS[category]}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
