import type { Metadata } from "next";
import TrackingView from "./TrackingView";

export const metadata: Metadata = {
  title: "Acompanhar ordem | SmartFix",
  description: "Acompanhamento seguro de ordem de serviço.",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ token: string }> };

export default async function TrackingPage({ params }: Props) {
  return <TrackingView token={(await params).token} />;
}
