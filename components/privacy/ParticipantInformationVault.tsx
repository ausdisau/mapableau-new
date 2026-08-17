"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  MAX_SHARE_TTL_DAYS,
  VAULT_ITEM_KINDS,
  type VaultItemKind,
} from "@/lib/privacy/participant-vault/errors";
import type { VaultItemSummary } from "@/lib/privacy/participant-vault/types";

const ACCEPT = "application/pdf,image/png,image/jpeg,text/plain";
const KIND_LABELS: Record<VaultItemKind, string> = {
  identity: "Identity",
  plan: "Plan",
  agreement: "Agreement",
  note: "Note",
  other: "Other",
};

type Props = {
  initialItems: VaultItemSummary[];
  uploadsAvailable: boolean;
  maxUploadMb: number;
};

function defaultExpiryIso(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 16);
}

export function ParticipantInformationVault({
  initialItems,
  uploadsAvailable,
  maxUploadMb,
}: Props) {
  const fileId = useId();
  const kindId = useId();
  const labelId = useId();
  const helpId = useId();
  const statusId = useId();
  const fileRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState(initialItems);
  const [kind, setKind] = useState<VaultItemKind>("identity");
  const [label, setLabel] = useState("");
  const [status, setStatus] = useState(
    uploadsAvailable
      ? "Choose a PDF, JPEG, PNG, or text file. No file selected."
      : "Uploads are unavailable. You can still view items already in your vault.",
  );
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function refresh() {
    const res = await fetch("/api/participant-vault/items");
    const data = (await res.json()) as { items?: VaultItemSummary[]; error?: string };
    if (!res.ok) throw new Error(data.error ?? "Could not refresh vault");
    setItems(data.items ?? []);
  }

  async function onUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!uploadsAvailable) {
      setError("Uploads are unavailable until ObjectStore document storage is enabled.");
      return;
    }
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file using the file picker. Drag-and-drop is not required.");
      return;
    }
    setUploading(true);
    setStatus("Uploading to your information vault…");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", kind);
      if (label.trim()) form.set("label", label.trim());
      const res = await fetch("/api/participant-vault/items", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { item?: VaultItemSummary; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error ?? "Upload failed");
      }
      setItems((current) => [data.item!, ...current]);
      setLabel("");
      if (fileRef.current) fileRef.current.value = "";
      setStatus("File added to your information vault.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("Upload did not complete.");
    } finally {
      setUploading(false);
    }
  }

  async function onShare(itemId: string, form: HTMLFormElement) {
    setError(null);
    const body = new FormData(form);
    const granteeUserId = String(body.get("granteeUserId") ?? "").trim();
    const purpose = String(body.get("purpose") ?? "").trim();
    const expiresLocal = String(body.get("expiresAt") ?? "");
    if (!granteeUserId || !purpose || !expiresLocal) {
      setError("Share needs a recipient, purpose, and expiry.");
      return;
    }
    const expiresAt = new Date(expiresLocal).toISOString();
    const res = await fetch(`/api/participant-vault/items/${itemId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ granteeUserId, purpose, expiresAt }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Share failed");
      return;
    }
    setStatus("Share granted.");
    await refresh();
  }

  async function onRevoke(itemId: string, grantId: string) {
    setError(null);
    const res = await fetch(`/api/participant-vault/items/${itemId}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Revoke failed");
      return;
    }
    setStatus("Share revoked.");
    await refresh();
  }

  async function onRemove(itemId: string) {
    setError(null);
    const res = await fetch(`/api/participant-vault/items/${itemId}`, {
      method: "DELETE",
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Remove failed");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== itemId));
    setStatus("Item removed from your vault.");
  }

  return (
    <div className="space-y-8">
      {uploadsAvailable ? (
        <form className="space-y-4 rounded-lg border p-4" onSubmit={onUpload}>
          <h2 className="font-heading text-lg font-semibold">Add a file</h2>
          <p id={helpId} className="text-sm text-muted-foreground">
            Accepted formats: PDF, JPEG, PNG, plain text. Maximum size {maxUploadMb} MB.
            Drag-and-drop is not required — use the file picker.
          </p>
          <div className="space-y-1">
            <label htmlFor={kindId} className="text-sm font-medium">
              Type
            </label>
            <select
              id={kindId}
              className={`min-h-11 w-full rounded-md border bg-background px-3 ${mapableInteractiveFocusRing}`}
              value={kind}
              onChange={(event) => setKind(event.target.value as VaultItemKind)}
            >
              {VAULT_ITEM_KINDS.map((value) => (
                <option key={value} value={value}>
                  {KIND_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor={labelId} className="text-sm font-medium">
              Label (optional)
            </label>
            <input
              id={labelId}
              className={`min-h-11 w-full rounded-md border bg-background px-3 ${mapableInteractiveFocusRing}`}
              maxLength={120}
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={fileId} className="text-sm font-medium">
              File
            </label>
            <input
              id={fileId}
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              aria-describedby={`${helpId} ${statusId}`}
              className={`block w-full text-sm ${mapableInteractiveFocusRing}`}
            />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading…" : "Add to vault"}
          </Button>
        </form>
      ) : (
        <p className="rounded-lg border p-4 text-sm" role="status">
          Uploads are unavailable. ObjectStore document storage is off, so this vault
          lists existing items only and does not write to local disk.
        </p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <p id={statusId} className="text-sm text-muted-foreground" role="status">
        {status}
      </p>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">Your artefacts</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items in your vault yet.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{item.label || item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {KIND_LABELS[item.kind]} · {item.mimeType} · {item.fileSize} bytes
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/api/documents/${item.documentId}`}
                      className={`inline-flex min-h-11 items-center rounded-lg border px-3 text-sm ${mapableInteractiveFocusRing}`}
                    >
                      Download
                    </a>
                    <Button type="button" variant="outline" onClick={() => void onRemove(item.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
                <form
                  className="grid gap-2 sm:grid-cols-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void onShare(item.id, event.currentTarget);
                  }}
                >
                  <label className="space-y-1 text-sm">
                    Recipient user id
                    <input
                      name="granteeUserId"
                      required
                      className={`min-h-11 w-full rounded-md border bg-background px-3 ${mapableInteractiveFocusRing}`}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    Purpose
                    <input
                      name="purpose"
                      required
                      minLength={8}
                      maxLength={500}
                      className={`min-h-11 w-full rounded-md border bg-background px-3 ${mapableInteractiveFocusRing}`}
                    />
                  </label>
                  <label className="space-y-1 text-sm">
                    Expires
                    <input
                      name="expiresAt"
                      type="datetime-local"
                      required
                      defaultValue={defaultExpiryIso()}
                      className={`min-h-11 w-full rounded-md border bg-background px-3 ${mapableInteractiveFocusRing}`}
                    />
                  </label>
                  <div className="flex items-end">
                    <Button type="submit" variant="secondary">
                      Share (max {MAX_SHARE_TTL_DAYS} days)
                    </Button>
                  </div>
                </form>
                {item.grants.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {item.grants.map((grant) => (
                      <li key={grant.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span>
                          Shared with {grant.granteeUserId}
                          {grant.revokedAt ? " (revoked)" : ` until ${grant.expiresAt}`}
                        </span>
                        {!grant.revokedAt ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void onRevoke(item.id, grant.id)}
                          >
                            Revoke
                          </Button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm">
        Need a platform export or deletion review? Use{" "}
        <Link href="/data-vault" className="text-primary underline">
          Export and deletion
        </Link>
        . Access Passport is a separate access-needs profile and is not shown here.
      </p>
    </div>
  );
}
