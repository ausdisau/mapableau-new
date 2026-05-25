export function StickyFormActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 flex gap-2 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0">
      {children}
    </div>
  );
}
