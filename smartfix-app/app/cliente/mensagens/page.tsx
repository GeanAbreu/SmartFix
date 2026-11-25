import HelpCenter from "@/app/cliente/ajuda/HelpCenter";
import { requirePageRole } from "@/src/services/page-authorization.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requirePageRole("client");
  return <HelpCenter />;
}
