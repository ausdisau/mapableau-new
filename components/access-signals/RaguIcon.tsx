import type { RaguShape, RaguStatus } from "@/lib/access-signals/ragu";
import { getRaguDescriptor } from "@/lib/access-signals/ragu";

const FILL: Record<RaguStatus, string> = {
  red: "#DC2626",
  amber: "#F59E0B",
  green: "#059669",
  unknown: "#64748B",
};

export function RaguIcon({
  status,
  size = 20,
  className = "",
}: {
  status: RaguStatus;
  size?: number;
  className?: string;
}) {
  const descriptor = getRaguDescriptor(status);
  const fill = FILL[status];
  const title = `${descriptor.label}: ${descriptor.shortDescription}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <RaguShapePath shape={descriptor.shape} fill={fill} />
    </svg>
  );
}

function RaguShapePath({ shape, fill }: { shape: RaguShape; fill: string }) {
  switch (shape) {
    case "circle":
      return <circle cx="12" cy="12" r="9" fill={fill} stroke="#0C1833" strokeWidth="1.5" />;
    case "triangle":
      return (
        <path
          d="M12 3.5 L21 20.5 H3 Z"
          fill={fill}
          stroke="#0C1833"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    case "square":
      return (
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="2"
          fill={fill}
          stroke="#0C1833"
          strokeWidth="1.5"
        />
      );
    case "diamond":
      return (
        <path
          d="M12 2.5 L21.5 12 L12 21.5 L2.5 12 Z"
          fill={fill}
          stroke="#0C1833"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    default: {
      const _exhaustive: never = shape;
      return _exhaustive;
    }
  }
}
