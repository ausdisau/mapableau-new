"use client";

import { formInputClass } from "@/components/forms/AccessibleFormField";

export function AccessNeedsForm() {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border p-4">
      <legend className="px-1 text-sm font-semibold">Access and trip needs</legend>
      <p className="text-sm text-muted-foreground">
        This information stays in MapAble and is only shared with your transport
        provider when you consent.
      </p>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="boardingAssistance" />
        I need boarding assistance
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="transferAssistance" />
        I need transfer assistance
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="hoistRequired" />
        Hoist required
      </label>
      <label htmlFor="companionCount" className="text-sm font-medium">
        Companion count (not including you)
      </label>
      <input
        id="companionCount"
        name="companionCount"
        type="number"
        min={0}
        max={8}
        defaultValue={0}
        className={formInputClass}
      />
      <label htmlFor="mobilityNotes" className="text-sm font-medium">
        Mobility aids
      </label>
      <input
        id="mobilityNotes"
        name="mobilityNotes"
        className={formInputClass}
        placeholder="e.g. manual wheelchair"
      />
      <label htmlFor="pickupNotes" className="text-sm font-medium">
        Pickup notes
      </label>
      <textarea id="pickupNotes" name="pickupNotes" rows={2} className={formInputClass} />
      <label htmlFor="commsPref" className="text-sm font-medium">
        Communication preference
      </label>
      <select id="commsPref" name="commsPref" className={formInputClass} defaultValue="in_app">
        <option value="in_app">In-app messages</option>
        <option value="sms">SMS</option>
        <option value="phone">Phone call</option>
        <option value="email">Email</option>
      </select>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" name="noUnexpectedCalls" />
        Please do not call without arranging first
      </label>
    </fieldset>
  );
}
