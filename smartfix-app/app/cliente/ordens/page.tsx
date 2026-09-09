import { requirePageRole } from "@/src/services/page-authorization.service";
import RepairWorkspace from "@/app/components/RepairWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePageRole("client");
  const query = (await searchParams).q;
  return (
    <RepairWorkspace
      role="client"
      initialQuery={typeof query === "string" ? query : ""}
    />
  );
}
