import type { ReactNode } from "react";
import { requirePageRole } from "@/src/services/page-authorization.service";
import PartnerShell from "./components/PartnerShell";

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  await requirePageRole("partner");
  return <PartnerShell>{children}</PartnerShell>;
}
