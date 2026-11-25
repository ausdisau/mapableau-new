import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { hasClerkTenant } from "../../../lib/clerk-config";
import { serviceEntry, serviceFor } from "../../../lib/service-directory";

export const dynamic = "force-dynamic";

export default async function ContinueToService({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const service = serviceFor((await params).service);
  if (!service) notFound();
  if (!hasClerkTenant() || !(await auth()).userId)
    redirect("/sign-in?service=" + service.id);
  return (
    <main id="main-content" className="container signin">
      <h1>Continue to {service.name}</h1>
      <p>
        You are signed in to AD.iD. {service.name} manages your access on its
        own site.
      </p>
      <a className="primary-button" href={serviceEntry(service.id)}>
        Continue to {service.name}
      </a>
      <p>
        <Link href="/dashboard">Choose another service</Link>
      </p>
    </main>
  );
}
