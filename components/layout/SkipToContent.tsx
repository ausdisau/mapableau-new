export function SkipToContent(): React.ReactElement {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:ring-2 focus:ring-blue-600 rounded-md"
    >
      Skip to main content
    </a>
  );
}
