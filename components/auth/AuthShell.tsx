import type { ReactNode } from "react";

export function AuthShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12"
      aria-labelledby="auth-title"
    >
      <h1
        id="auth-title"
        className="font-heading mb-6 text-2xl font-bold text-foreground"
      >
        {title}
      </h1>
      {children}
    </main>
  );
}
