import { saveAccessMediaFile } from "@/lib/storage/access-media";
import { prisma } from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function uploadReviewPhoto(params: {
  reviewId: string;
  buffer: Buffer;
  mimeType: string;
  altText: string;
  uploadedById: string;
}) {
  if (!ALLOWED_TYPES.has(params.mimeType)) {
    throw new Error("INVALID_FILE_TYPE");
  }
  if (params.buffer.length > MAX_FILE_SIZE) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!params.altText.trim()) {
    throw new Error("ALT_TEXT_REQUIRED");
  }

  const review = await prisma.accessPlaceReview.findUnique({
    where: { id: params.reviewId },
    select: { id: true, reviewerProfileId: true, placeId: true },
  });
  if (!review) throw new Error("REVIEW_NOT_FOUND");
  if (review.reviewerProfileId !== params.uploadedById) {
    throw new Error("FORBIDDEN");
  }

  const storagePath = await saveAccessMediaFile({
    buffer: params.buffer,
    mimeType: params.mimeType,
    prefix: "reviews",
  });

  const photo = await prisma.accessPlaceReviewPhoto.create({
    data: {
      reviewId: params.reviewId,
      storagePath,
      altText: params.altText.trim(),
      mimeType: params.mimeType,
      status: "pending",
    },
  });

  await prisma.accessModerationQueue.create({
    data: {
      entityType: "AccessPlaceReviewPhoto",
      entityId: photo.id,
      reviewId: params.reviewId,
      flagReason: "Photo pending privacy review",
    },
  });

  return photo;
}
