import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerOrders from "./PartnerOrders";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  await requirePageRole("partner");
  const { order } = await searchParams;
  return <PartnerOrders initialOrderId={order || ""} />;
}
