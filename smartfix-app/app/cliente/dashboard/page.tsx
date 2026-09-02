import ClientDashboard from "./ClientDashboard";
import { requirePageRole } from "@/src/services/page-authorization.service";

export const dynamic = "force-dynamic";

export default async function ClienteDashboardPage() {
  await requirePageRole("client");

  return <ClientDashboard />;
}
