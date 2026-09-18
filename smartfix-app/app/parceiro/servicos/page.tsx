import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerServices from "./PartnerServices";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("partner");
  return <PartnerServices />;
}
