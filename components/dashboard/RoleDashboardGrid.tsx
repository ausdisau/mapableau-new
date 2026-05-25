export function RoleDashboardGrid({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full max-w-full flex-col gap-4 overflow-x-hidden">
      {children}
    </div>
  );
}
