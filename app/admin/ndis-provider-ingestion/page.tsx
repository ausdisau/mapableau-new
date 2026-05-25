import { NdisIngestionClient } from "./NdisIngestionClient";
import { getLatestIngestionRun } from "@/lib/ingestion/ndisProviders";

export const metadata = {
  title: "NDIS provider ingestion | MapAble admin",
};

export default async function NdisProviderIngestionPage() {
  const lastRun = await getLatestIngestionRun().catch(() => null);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-3xl font-bold">NDIS provider ingestion</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Loads the public NDIS provider finder JSON into MapAble for discovery and
          search. This is directory data from a static frontend asset — not a live API
          and not verified by MapAble. Confirm registration status with official NDIS
          sources before operational use.
        </p>
      </header>

      <section
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
        role="note"
      >
        <h2 className="font-semibold">Data caveat</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Treat ingested records as indicative only. Raw JSON is retained for
          reprocessing. A future verification layer should confirm current NDIS
          registration before representing providers as verified.
        </p>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Last run</h2>
        {lastRun ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="font-medium">{lastRun.status}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Provider count</dt>
              <dd className="font-medium">{lastRun.providerCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Started</dt>
              <dd className="font-medium">
                {lastRun.startedAt.toLocaleString("en-AU", {
                  timeZone: "Australia/Sydney",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Finished</dt>
              <dd className="font-medium">
                {lastRun.finishedAt
                  ? lastRun.finishedAt.toLocaleString("en-AU", {
                      timeZone: "Australia/Sydney",
                    })
                  : "—"}
              </dd>
            </div>
            {lastRun.errorMessage ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Error</dt>
                <dd className="text-destructive">{lastRun.errorMessage}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            No ingestion runs recorded yet.
          </p>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Manual run</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Triggers the same pipeline as the scheduled cron. This may take several
          minutes.
        </p>
        <div className="mt-4">
          <NdisIngestionClient />
        </div>
      </section>
    </div>
  );
}
