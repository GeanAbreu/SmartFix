import PartnerFinance from "./PartnerFinance";
import { requirePageRole } from "@/src/services/page-authorization.service";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  await requirePageRole("partner");
  return <PartnerFinance />;
}
