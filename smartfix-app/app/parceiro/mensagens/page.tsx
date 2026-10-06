import SupportInbox from "@/app/components/SupportInbox";
import { requirePageRole } from "@/src/services/page-authorization.service";
export const dynamic = "force-dynamic";
export default async function Page() { await requirePageRole("partner"); return <SupportInbox mode="partner" />; }
