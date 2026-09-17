import { requirePageRole } from "@/src/services/page-authorization.service";
import AssistanceFinder from "./AssistanceFinder";
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ deviceId?: string; partnerId?: string }> }) {
  const session = await requirePageRole("client");
  const params = await searchParams;
  return <AssistanceFinder accountId={session.sub} deviceId={typeof params.deviceId === "string" ? params.deviceId : ""}
    partnerId={typeof params.partnerId === "string" ? params.partnerId : ""} />;
}
