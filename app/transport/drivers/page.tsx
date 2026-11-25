import DriverWeb from "@/components/transport/drivers/DriverWeb";
import { canonicalAlternate } from "@/lib/config/canonical-url";
export const metadata = {
  title: "Drivers | MapAble Transport",
  description:
    "Practise an accessible transport shift or open your assigned MapAble driver trips.",
  alternates: canonicalAlternate("/transport/drivers"),
};
export default function DriversPage() {
  return <DriverWeb />;
}
