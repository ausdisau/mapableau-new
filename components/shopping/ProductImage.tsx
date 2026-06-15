import Image from "next/image";

import { getProductImageUrl } from "@/lib/shopping/images";

type ProductImageProps = {
  title: string;
  imageUrls: string[];
  className?: string;
  priority?: boolean;
};

export function ProductImage({
  title,
  imageUrls,
  className = "",
  priority = false,
}: ProductImageProps) {
  const src = getProductImageUrl(imageUrls, title);

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-100 ${className}`}
    >
      <Image
        src={src}
        alt={title}
        width={600}
        height={400}
        priority={priority}
        className="h-full w-full object-cover"
        unoptimized={src.includes("placehold.co")}
      />
    </div>
  );
}
