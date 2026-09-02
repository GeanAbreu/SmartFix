import { requirePageRole } from "@/src/services/page-authorization.service";
import HelpCenter from "./HelpCenter";

export const dynamic = "force-dynamic";

export default async function ClientHelpPage() {
  await requirePageRole("client");
  return <HelpCenter />;
}
