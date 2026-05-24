"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Note = { id: string; title: string; category: string; content: string };

export default function CriticalNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("medication");

  useEffect(() => {
    fetch("/api/emergency/critical-notes")
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []));
  }, []);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/emergency/critical-notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category }),
    });
    if (res.ok) {
      const d = await res.json();
      setNotes((prev) => [d.note, ...prev]);
      setTitle("");
      setContent("");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/dashboard/emergency" className="text-sm text-primary underline">
        ← Emergency
      </Link>
      <h1 className="font-heading text-2xl font-bold">Critical access notes</h1>
      <form onSubmit={addNote} className="space-y-3 rounded-xl border border-border p-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full min-h-10 rounded-lg border border-border px-3"
        >
          <option value="medication">Medication</option>
          <option value="equipment">Equipment</option>
          <option value="access">Access</option>
          <option value="general">General</option>
        </select>
        <input
          required
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full min-h-10 rounded-lg border border-border px-3"
        />
        <textarea
          required
          placeholder="Details for responders and supporters"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-border px-3 py-2"
        />
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Add note
        </button>
      </form>
      <ul className="space-y-3">
        {notes.map((n) => (
          <li key={n.id} className="rounded-lg border border-border p-4">
            <span className="text-xs uppercase text-muted-foreground">
              {n.category}
            </span>
            <h2 className="font-medium">{n.title}</h2>
            <p className="mt-1 text-sm whitespace-pre-wrap">{n.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
