import { requirePageRole } from "@/src/services/page-authorization.service";
import DeviceManager from "./DeviceManager";

export const dynamic = "force-dynamic";

export default async function ClientDevicesPage({ searchParams }: { searchParams: Promise<{ partnerId?: string }> }) {
  await requirePageRole("client");
  const { partnerId } = await searchParams;
  return <DeviceManager returnPartnerId={typeof partnerId === "string" && /^[0-9a-f-]{36}$/i.test(partnerId) ? partnerId : ""} />;
}
