import { requirePageRole } from "@/src/services/page-authorization.service";
import AddressManager from "./AddressManager";

export const dynamic = "force-dynamic";

export default async function ClientAddressesPage() {
  await requirePageRole("client");
  return <AddressManager />;
}
