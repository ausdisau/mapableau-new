import { SupportDeskQueue } from "@/components/support-desk/SupportDeskQueue";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Support desk | Admin" };

export default async function AdminSupportDeskPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { tags: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Support desk</h1>
        <p className="text-muted-foreground">Triage and respond to platform support requests.</p>
      </header>
      <SupportDeskQueue tickets={tickets} />
    </div>
  );
}
