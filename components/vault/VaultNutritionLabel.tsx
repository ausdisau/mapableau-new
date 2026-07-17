import type { VaultNutritionLabel as Label } from "@/lib/vault/types";

export function VaultNutritionLabelView({ label }: { label: Label }) {
  return (
    <article
      className="space-y-4 rounded-lg border border-border bg-card p-4"
      aria-labelledby={`vault-item-${label.itemId}-title`}
    >
      <header>
        <h2
          id={`vault-item-${label.itemId}-title`}
          className="font-heading text-xl font-semibold"
        >
          {label.itemName}
        </h2>
        <p className="text-sm text-muted-foreground">Data nutrition label</p>
      </header>

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium">Canonical source</dt>
          <dd>{label.canonicalSource}</dd>
        </div>
        <div>
          <dt className="font-medium">Sensitivity</dt>
          <dd>
            <span className="sr-only">Classification: </span>
            {label.sensitivity.replaceAll("_", " ")}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium">Stored</dt>
          <dd>{label.storageLocation}</dd>
        </div>
        <div>
          <dt className="font-medium">Encryption state</dt>
          <dd>{label.encryptionState}</dd>
        </div>
        <div>
          <dt className="font-medium">Purpose</dt>
          <dd>{label.purpose}</dd>
        </div>
        <div>
          <dt className="font-medium">Export status</dt>
          <dd>{label.exportStatus}</dd>
        </div>
        <div>
          <dt className="font-medium">Expiry</dt>
          <dd>{label.expiresAt ?? "No expiry on index entry"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="font-medium">Retention reason</dt>
          <dd>{label.retentionReason}</dd>
        </div>
      </dl>

      <section aria-labelledby={`fields-${label.itemId}`}>
        <h3 id={`fields-${label.itemId}`} className="font-medium">
          Fields in manifest
        </h3>
        {label.fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fields listed.</p>
        ) : (
          <ul className="mt-2 list-disc pl-5 text-sm">
            {label.fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby={`deletion-${label.itemId}`}>
        <h3 id={`deletion-${label.itemId}`} className="font-medium">
          Deletion options
        </h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {label.deletionOptions.map((option) => (
            <li key={option}>{option}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={`limits-${label.itemId}`}>
        <h3 id={`limits-${label.itemId}`} className="font-medium">
          Limitations
        </h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {label.limitations.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <a className="text-primary underline" href={label.auditLink}>
          View related history
        </a>
      </p>
    </article>
  );
}
