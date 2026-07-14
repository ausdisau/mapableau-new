import { AcademyChrome } from "@/components/academy/AcademyChrome";

/** Academy pages read live catalogue/enrolment data — do not statically prerender without DATABASE_URL. */
export const dynamic = "force-dynamic";

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademyChrome>{children}</AcademyChrome>;
}
