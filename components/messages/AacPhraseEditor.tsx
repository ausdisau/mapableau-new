"use client";

import { useEffect, useState } from "react";

import { formInputClass } from "@/components/forms/AccessibleFormField";
import { Button } from "@/components/ui/button";
import type { AacPhrase } from "@/types/messages";

type DraftPhrase = { label: string; phrase: string; category: string };

export function AacPhraseEditor() {
  const [phrases, setPhrases] = useState<DraftPhrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/aac/phrases");
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.phrases as AacPhrase[]) ?? [];
        setPhrases(
          list.map((p) => ({
            label: p.label,
            phrase: p.phrase,
            category: p.category,
          }))
        );
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateRow(index: number, field: keyof DraftPhrase, value: string) {
    setPhrases((rows) =>
      rows.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addRow() {
    setPhrases((rows) => [
      ...rows,
      { label: "New phrase", phrase: "", category: "custom" },
    ]);
  }

  function removeRow(index: number) {
    setPhrases((rows) => rows.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      const res = await fetch("/api/aac/phrases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phrases: phrases
            .filter((p) => p.label.trim() && p.phrase.trim())
            .map((p, i) => ({
              label: p.label.trim(),
              phrase: p.phrase.trim(),
              category: p.category.trim() || "custom",
              sortOrder: i,
            })),
        }),
      });
      if (!res.ok) {
        setStatus("Could not save phrases. Check each row has a label and message.");
        return;
      }
      const data = await res.json();
      const list = (data.phrases as AacPhrase[]) ?? [];
      setPhrases(
        list.map((p) => ({
          label: p.label,
          phrase: p.phrase,
          category: p.category,
        }))
      );
      setStatus("Quick phrases saved.");
    } catch {
      setStatus("Could not save phrases. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading quick phrases…</p>;
  }

  return (
    <section className="space-y-4 rounded-xl border border-border p-6" aria-labelledby="aac-editor-heading">
      <header>
        <h2 id="aac-editor-heading" className="font-heading text-lg font-bold">
          AAC quick phrases
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Large buttons in messages and calls use these plain-language phrases. Keep labels short.
        </p>
      </header>

      <ul className="space-y-4" role="list">
        {phrases.map((row, index) => (
          <li
            key={index}
            className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_2fr_auto]"
          >
            <div>
              <label htmlFor={`aac-label-${index}`} className="text-sm font-medium">
                Button label
              </label>
              <input
                id={`aac-label-${index}`}
                className={formInputClass}
                value={row.label}
                onChange={(e) => updateRow(index, "label", e.target.value)}
                maxLength={40}
              />
            </div>
            <div>
              <label htmlFor={`aac-phrase-${index}`} className="text-sm font-medium">
                Message text
              </label>
              <input
                id={`aac-phrase-${index}`}
                className={formInputClass}
                value={row.phrase}
                onChange={(e) => updateRow(index, "phrase", e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="min-h-11"
                onClick={() => removeRow(index)}
                aria-label={`Remove phrase ${row.label}`}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" size="default" className="min-h-11" onClick={addRow}>
          Add phrase
        </Button>
        <Button
          type="button"
          variant="default"
          size="default"
          className="min-h-11"
          loading={saving}
          onClick={() => void save()}
        >
          Save phrases
        </Button>
      </div>

      {status ? (
        <p className="text-sm" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
