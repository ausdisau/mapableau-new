import { NewTransportForm } from "@/components/transport/NewTransportForm";
import { isDynamicRoutingEnabled } from "@/lib/config/dynamic-routing";

export default function NewTransportPage() {
  return (
    <NewTransportForm dynamicRoutingEnabled={isDynamicRoutingEnabled()} />
  );
}
