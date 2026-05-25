import { jsonOk } from "@/lib/api/response";
import { getTranslations } from "@/lib/internationalisation/i18n-service";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const namespace =
    new URL(req.url).searchParams.get("namespace") ?? "common";
  return jsonOk(await getTranslations(locale, namespace));
}
