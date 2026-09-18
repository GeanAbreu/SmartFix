import { requirePageRole } from "@/src/services/page-authorization.service";
import ClientReviews from "./ClientReviews";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  await requirePageRole("client");
  const { order } = await searchParams;
  return <ClientReviews initialOrderId={typeof order === "string" ? order : ""} />;
}
