import { requirePageRole } from "@/src/services/page-authorization.service";
import ClientProfilePage from "./ClientProfilePage";
export const dynamic = "force-dynamic";
export default async function Page() {
  await requirePageRole("client");
  return <ClientProfilePage />;
}
