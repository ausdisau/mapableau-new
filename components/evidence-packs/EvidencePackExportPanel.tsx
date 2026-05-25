"use client";

export function EvidencePackExportPanel({ packId }: { packId: string }) {
  async function exportPack() {
    await fetch(`/api/evidence-packs/${packId}/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "json" }),
    });
  }

  return (
    <section>
      <button type="button" onClick={() => void exportPack()} className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">
        Export pack
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        Export is recorded in the audit log. PDF export may be a placeholder in this build.
      </p>
    </section>
  );
}
