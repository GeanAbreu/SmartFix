import PartnerNetwork from "./PartnerNetwork";
import { requirePageRole } from "@/src/services/page-authorization.service";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  await requirePageRole("partner");
  return <PartnerNetwork />;
}
