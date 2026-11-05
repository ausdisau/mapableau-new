import {
  COVERAGE_CARE_BRAND,
  COVERAGE_CARE_WAVE_PATH,
} from "@/lib/coverage-care/brand";

export function BrandWaveMark({
  className = "",
  title = COVERAGE_CARE_BRAND.name,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 40"
      role="img"
      aria-label={title}
      width={160}
      height={40}
    >
      <title>{title}</title>
      <path
        d={COVERAGE_CARE_WAVE_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="20" cy="18" r="3.5" fill="currentColor" />
      <circle cx="80" cy="26" r="3.5" fill="currentColor" />
      <circle cx="140" cy="18" r="3.5" fill="currentColor" />
    </svg>
  );
}
