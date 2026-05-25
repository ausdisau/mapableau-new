import { notFound } from "next/navigation";

import {
  DeliveryHandoverChecklist,
  DriverFoodDeliveryScreen,
} from "@/components/foods/DriverFoodDeliveryActions";
import { FoodDeliveryMap } from "@/components/foods/TransportTripMap";
import { requirePermission } from "@/lib/auth/guards";
import { toDriverDeliveryDTO } from "@/lib/foods/access-control";
import { prisma } from "@/lib/prisma";

export default async function DriverFoodDeliveryPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const user = await requirePermission("foods:deliver:assigned");
  const { assignmentId } = await params;
  const assignment = await prisma.foodDeliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: { order: { include: { items: true } } },
  });
  if (!assignment || assignment.driverUserId !== user.id) notFound();
  const dto = await toDriverDeliveryDTO(assignment, user.id);
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-xl font-bold">Delivery handover</h1>
      <div className="rounded-xl border p-4">
        <p className="font-medium">{dto.address.address}</p>
        <p className="text-sm text-muted-foreground">{dto.address.instructions}</p>
        {dto.minimalAllergenFlags.length ? (
          <p className="mt-2 text-sm">Allergen flags: {dto.minimalAllergenFlags.join(", ")}</p>
        ) : null}
      </div>
      <FoodDeliveryMap />
      <DriverFoodDeliveryScreen assignmentId={assignment.id} />
      <DeliveryHandoverChecklist assignmentId={assignment.id} />
    </div>
  );
}
