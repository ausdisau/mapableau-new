/**
 * Marketing route-group loading UI — keeps the shell header/footer from the
 * parent layout while announcing a polite status (no competing H1).
 */
export default function MarketingLoading() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center px-5 py-16">
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm"
        role="status"
        aria-live="polite"
      >
        <div
          className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#005B7F]/20 border-t-[#005B7F] motion-reduce:animate-none"
          aria-hidden="true"
        />
        <p className="text-base font-semibold text-[#0C1833]">Loading page</p>
      </div>
    </div>
  );
}
