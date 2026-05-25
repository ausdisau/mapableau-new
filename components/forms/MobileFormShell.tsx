export function MobileFormShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <form className="flex w-full max-w-full flex-col gap-4 overflow-x-hidden">
      <header>
        <h2 className="font-heading text-lg font-bold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </form>
  );
}
