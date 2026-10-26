import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerProfilePage from "./PartnerProfilePage";

export default async function Page() {
  await requirePageRole("partner");
  return <PartnerProfilePage />;
}
