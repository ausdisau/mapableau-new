"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function AskPeerQuestionForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  async function submit() {
    setErrors([]);
    if (!title.trim() || !body.trim()) {
      setErrors(["Title and question are required."]);
      return;
    }
    const res = await fetch("/api/peer/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    if (!res.ok) {
      setErrors(["Could not submit. Your question may be queued for moderation."]);
      return;
    }
    window.location.href = "/peer/questions";
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      {errors.length ? (
        <div className="rounded-md border border-destructive/50 p-3" role="alert">
          <ul className="list-disc pl-5 text-sm">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <label htmlFor="q-title" className="text-sm font-medium">
          Question title
        </label>
        <input
          id="q-title"
          className="mt-1 min-h-11 w-full rounded-md border px-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="q-body" className="text-sm font-medium">
          Your question
        </label>
        <textarea
          id="q-body"
          rows={6}
          className="mt-1 min-h-24 w-full rounded-md border px-3 py-2"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <Button type="submit" variant="default" size="default" className="min-h-11">
        Ask the community
      </Button>
    </form>
  );
}
