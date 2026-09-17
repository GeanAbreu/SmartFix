import { requirePageRole } from "@/src/services/page-authorization.service";
import RepairWorkspace from "@/app/components/RepairWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  await requirePageRole("partner");
  const { order } = await searchParams;
  return <RepairWorkspace role="partner" initialQuery={order || ""} />;
}
