import { requirePageRole } from "@/src/services/page-authorization.service";
import RepairRequest from "./RepairRequest";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ deviceId?: string; partnerId?: string }>;
}) {
  const session = await requirePageRole("client");
  const params = await searchParams;
  return (
    <RepairRequest
      accountId={session.sub}
      initialPartnerId={typeof params.partnerId === "string" ? params.partnerId : ""}
    />
  );
}
