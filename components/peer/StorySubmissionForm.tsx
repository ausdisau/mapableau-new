"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function StorySubmissionForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function submit() {
    await fetch("/api/peer/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    window.location.href = "/peer/stories";
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <label htmlFor="story-title" className="text-sm font-medium">
        Title
      </label>
      <input
        id="story-title"
        className="min-h-11 w-full rounded-md border px-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <label htmlFor="story-body" className="text-sm font-medium">
        Story or resource summary
      </label>
      <textarea
        id="story-body"
        rows={8}
        className="w-full rounded-md border px-3 py-2"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button type="submit" variant="default" size="default" className="min-h-11">
        Submit for review
      </Button>
    </form>
  );
}
