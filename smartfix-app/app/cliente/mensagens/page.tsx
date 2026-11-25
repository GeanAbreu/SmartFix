import { requirePageRole } from "@/src/services/page-authorization.service";
import ClientMessages from "./ClientMessages";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requirePageRole("client");
  return <ClientMessages />;
}
