import { Suspense } from "react";

import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <p className="mx-auto mt-10 max-w-md text-sm text-muted-foreground">
          Loading registration form…
        </p>
      }
    >
      <RegisterClient />
    </Suspense>
  );
}
