import { readAdCreativeFile } from "@/lib/storage/ad-creatives";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ fileKey: string }> }
) {
  const { fileKey } = await params;
  try {
    const buffer = await readAdCreativeFile(decodeURIComponent(fileKey));
    const ext = fileKey.toLowerCase();
    let contentType = "image/png";
    if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (ext.endsWith(".webp")) {
      contentType = "image/webp";
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
