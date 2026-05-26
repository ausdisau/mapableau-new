import Link from "next/link";

import { routes } from "@/lib/routing/canonical-routes";

export default function CareFindPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Find care providers</h1>
      <p className="text-muted-foreground">
        Browse registered providers or use the provider finder to explore services in your
        area.
      </p>
      <Link href={routes.care.findProviders} className="text-primary underline">
        Open provider finder
      </Link>
    </div>
  );
}
