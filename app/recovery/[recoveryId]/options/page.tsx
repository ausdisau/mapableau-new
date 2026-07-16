import { redirect } from "next/navigation";

type Props = { params: Promise<{ recoveryId: string }> };

export default async function RecoveryOptionsRedirect({ params }: Props) {
  const { recoveryId } = await params;
  redirect(`/recovery/${recoveryId}`);
}
