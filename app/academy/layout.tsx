import { AcademyChrome } from "@/components/academy/AcademyChrome";

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AcademyChrome>{children}</AcademyChrome>;
}
