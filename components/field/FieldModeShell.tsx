export function FieldModeShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 pb-4">
      <h1 className="font-heading text-xl font-bold">{title}</h1>
      {children}
    </div>
  );
}
