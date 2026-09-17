import { requirePageRole } from "@/src/services/page-authorization.service";
import RepairWorkspace from "@/app/components/RepairWorkspace";
export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; partnerId?: string; deviceId?: string }>;
}) {
  const session = await requirePageRole("client");
  const params = await searchParams;
  const query = params.q;
  return (
    <RepairWorkspace
      role="client"
      accountId={session.sub}
      initialQuery={typeof query === "string" ? query : ""}
      initialPartnerId={typeof params.partnerId === "string" ? params.partnerId : ""}
      initialDeviceId={typeof params.deviceId === "string" ? params.deviceId : ""}
    />
  );
}
