import { requirePageRole } from "@/src/services/page-authorization.service";
import ClientOrders from "./ClientOrders";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; partnerId?: string; deviceId?: string }>;
}) {
  await requirePageRole("client");
  const params = await searchParams;
  if (params.partnerId || params.deviceId) {
    const query = new URLSearchParams();
    if (params.partnerId) query.set("partnerId", params.partnerId);
    if (params.deviceId) query.set("deviceId", params.deviceId);
    redirect(`/cliente/solicitar-reparo?${query.toString()}`);
  }
  const query = params.q;
  return <ClientOrders initialQuery={typeof query === "string" ? query : ""} />;
}
