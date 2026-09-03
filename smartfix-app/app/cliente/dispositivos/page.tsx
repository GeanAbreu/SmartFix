import { requirePageRole } from "@/src/services/page-authorization.service";
import DeviceManager from "./DeviceManager";

export const dynamic = "force-dynamic";

export default async function ClientDevicesPage() {
  await requirePageRole("client");
  return <DeviceManager />;
}
