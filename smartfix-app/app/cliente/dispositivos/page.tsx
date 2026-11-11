import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientDevicesPage({ searchParams }: { searchParams: Promise<{ partnerId?: string }> }) {
  const { partnerId } = await searchParams;
  redirect(typeof partnerId === "string" ? `/cliente/solicitar-reparo?partnerId=${encodeURIComponent(partnerId)}` : "/cliente/solicitar-reparo");
}
