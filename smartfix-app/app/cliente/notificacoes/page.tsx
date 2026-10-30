import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerNotifications from "@/app/parceiro/notificacoes/PartnerNotifications";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("client");
  return <PartnerNotifications audience="client" />;
}
