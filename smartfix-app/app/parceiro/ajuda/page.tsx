import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerHelp from "./PartnerHelp";

export const dynamic = "force-dynamic";

export default async function PartnerHelpPage() {
  await requirePageRole("partner");
  return <PartnerHelp />;
}
