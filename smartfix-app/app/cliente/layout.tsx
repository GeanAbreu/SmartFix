import type { ReactNode } from "react";
import { requirePageRole } from "@/src/services/page-authorization.service";
import ClientShell from "./components/ClientShell";

export default async function ClientLayout({ children }: { children: ReactNode }) {
  await requirePageRole("client");
  return <ClientShell>{children}</ClientShell>;
}
