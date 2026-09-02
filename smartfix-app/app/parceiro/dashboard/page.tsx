import PartnerDashboard from "./PartnerDashboard";
import { requirePageRole } from "@/src/services/page-authorization.service";

export const dynamic = "force-dynamic";

export default async function ParceiroDashboardPage() {
  await requirePageRole("partner");

  return <PartnerDashboard />;
}

