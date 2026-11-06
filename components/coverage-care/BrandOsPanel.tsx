"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { CoverageCareBrandContentItem } from "@/lib/coverage-care/types";

export function BrandOsPanel({
  items,
}: {
  items: CoverageCareBrandContentItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function createItem() {
    setError(null);
    const response = await fetch("/api/coverage-care/brandos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "messaging",
        title,
        body,
      }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Create failed");
      return;
    }
    setTitle("");
    setBody("");
    router.refresh();
  }

  async function review(itemId: string, approvalStatus: "approved" | "rejected") {
    setError(null);
    const response = await fetch(`/api/coverage-care/brandos/${itemId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalStatus }),
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error ?? "Review failed");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <form
        className="space-y-3 rounded-md border border-[color:var(--cc-sage)]/30 bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => void createItem());
        }}
      >
        <h2 className="text-lg font-semibold text-[color:var(--cc-olive)]">
          Submit messaging for approval
        </h2>
        <label className="block text-sm font-medium">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            className="mt-1 min-h-11 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          />
        </label>
        <label className="block text-sm font-medium">
          Body
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            rows={3}
            className="mt-1 w-full rounded-md border border-[color:var(--cc-olive)]/30 px-3 py-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-olive)] px-4 text-white disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-sage)]"
        >
          Submit for approval
        </button>
      </form>

      <ul className="space-y-3" aria-label="Brand content items">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-md border border-[color:var(--cc-sage)]/25 bg-white p-4"
          >
            <p className="font-medium text-[color:var(--cc-olive)]">
              {item.title}{" "}
              <span className="text-sm font-normal text-[color:var(--cc-ink)]/70">
                ({item.kind} · {item.approvalStatus.replaceAll("_", " ")})
              </span>
            </p>
            <p className="mt-2 text-sm">{item.body}</p>
            {item.approvalStatus === "pending_approval" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => void review(item.id, "approved"))
                  }
                  className="inline-flex min-h-11 items-center rounded-md bg-[color:var(--cc-sage)] px-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--cc-olive)]"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => void review(item.id, "rejected"))
                  }
                  className="inline-flex min-h-11 items-center rounded-md border border-red-800 px-4 text-red-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
                >
                  Reject
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
