"use client";

import { useState } from "react";

type Option = {
  id: string;
  label: string;
  selected: boolean;
};

export function BackupOptionList({
  caseId,
  options,
}: {
  caseId: string;
  options: Option[];
}) {
  const [list, setList] = useState(options);
  const [message, setMessage] = useState<string | null>(null);

  async function findBackups() {
    const res = await fetch(`/api/service-recovery/cases/${caseId}/find-backups`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setList(data.options ?? list);
      setMessage("Backup options updated.");
    }
  }

  async function selectOption(optionId: string) {
    const res = await fetch(`/api/service-recovery/cases/${caseId}/select-backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionId }),
    });
    if (res.ok) {
      setMessage("Your choice was saved. A provider may still need to confirm.");
      setList((prev) =>
        prev.map((o) => ({ ...o, selected: o.id === optionId }))
      );
    }
  }

  return (
    <section aria-labelledby="backup-options-heading" className="space-y-3">
      <h2 id="backup-options-heading" className="font-heading text-lg font-semibold">
        Backup options
      </h2>
      <div aria-live="polite" className="text-sm text-muted-foreground">
        {message}
      </div>
      <button
        type="button"
        onClick={() => void findBackups()}
        className="min-h-11 rounded-lg border border-input px-4"
      >
        Find backup options
      </button>
      <ul className="space-y-2">
        {list.map((o) => (
          <li key={o.id} className="flex items-center justify-between rounded-lg border p-3">
            <span>{o.label}</span>
            <button
              type="button"
              onClick={() => void selectOption(o.id)}
              className="min-h-11 rounded-lg bg-primary px-3 text-primary-foreground"
              aria-pressed={o.selected}
            >
              {o.selected ? "Selected" : "Choose"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
