import { DisputeForm } from "@/components/disputes/DisputeForm";

export const metadata = { title: "New dispute | MapAble Core" };

export default function NewDisputePage({
  searchParams,
}: {
  searchParams: Promise<{
    bookingId?: string;
    invoiceId?: string;
    timesheetId?: string;
  }>;
}) {
  return (
    <DisputeFormWrapper searchParams={searchParams} />
  );
}

async function DisputeFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{
    bookingId?: string;
    invoiceId?: string;
    timesheetId?: string;
  }>;
}) {
  const sp = await searchParams;
  return (
    <DisputeForm
      bookingId={sp.bookingId}
      invoiceId={sp.invoiceId}
      timesheetId={sp.timesheetId}
    />
  );
}
