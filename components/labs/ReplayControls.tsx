export function ReplayControls({
  canReplay,
  onReplay,
  completedRuns,
}: {
  canReplay: boolean;
  onReplay: () => void;
  completedRuns: number;
}) {
  return (
    <section
      className="rounded-3xl border border-white/10 p-5"
      aria-labelledby="replay-heading"
    >
      <h2 id="replay-heading" className="text-lg font-black">
        Replay
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/65">
        Replay keeps previous runs. Choose another autonomy mode and compare.
        Completed runs stored locally: {completedRuns}.
      </p>
      <button
        type="button"
        disabled={!canReplay}
        className="mt-4 min-h-12 rounded-xl border border-white/20 px-4 font-black transition hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 disabled:opacity-40"
        onClick={onReplay}
      >
        Replay with another mode
      </button>
    </section>
  );
}
