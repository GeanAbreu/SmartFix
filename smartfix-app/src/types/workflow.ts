export type OrderStatus =
  | "pending"
  | "quoted"
  | "approved"
  | "in_progress"
  | "waiting_parts"
  | "ready"
  | "completed"
  | "rejected"
  | "cancelled";
export type QuoteItem = {
  name: string;
  category: "part" | "labor";
  details: string;
  quantity: number;
  unitPriceCents: number;
};
export type LogisticsEvent = {
  id: string;
  status: string;
  at: string;
};
export type LogisticsLeg = {
  direction: "pickup" | "return";
  quoteId?: string;
  quotedFeeCents?: number;
  quoteExpiresAt?: string;
  pickupAddress: string;
  dropoffAddress: string;
  deliveryId?: string;
  status: string;
  trackingUrl?: string;
  lastEventAt?: string;
  verification: "photo_and_pin";
  events: LogisticsEvent[];
  error?: string;
};
export type ServiceDetails = {
  estimatedDays: number;
  warrantyDays: number;
  warrantyStartsAt?: string;
  warrantyEndsAt?: string;
  deliveredAt?: string;
  completionMethod?: "uber_direct" | "client_confirmation";
  deliveryFeeCents: number;
  couponCode: string;
  discountCents: number;
  scheduledDate: string;
  schedulePeriod: "morning" | "afternoon" | "";
  serviceAddress: string;
  serviceAddressId?: string;
  paymentMethod: "pix" | "card" | "";
  paymentStatus: "pending" | "confirmed";
  paidAt: string;
  paymentProvider?: "mercado_pago";
  paymentPreferenceId?: string;
  paymentId?: string;
  technicianName?: string;
  promisedDate?: string;
  internalNotes?: string;
  rejectionReason?: string;
  cancellationRequestedAt?: string;
  cancellationReason?: string;
  refundStatus?: "pending" | "processed" | "failed";
  refundId?: string;
  refundAmountCents?: number;
  refundedAt?: string;
  logistics?: {
    provider: "uber_direct";
    pickup?: LogisticsLeg;
    return?: LogisticsLeg;
  };
};
export type RepairOrder = {
  id: string;
  clientId: string;
  partnerId: string;
  deviceId: string;
  device: string;
  problem: string;
  symptoms: string[];
  checklist: string[];
  status: OrderStatus;
  quote: QuoteItem[];
  diagnosis: string;
  serviceDetails: ServiceDetails;
  history: { status: OrderStatus; at: string }[];
  review: { rating: number; comment: string } | null;
  createdAt: string;
  trackingTokenNonce?: string;
  trackingTokenHash?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
};
export type WorkflowRecord = {
  id: string;
  kind: "order" | "notification" | "reset" | "google" | "service";
  ownerId: string;
  data: Record<string, unknown>;
};
export const ORDER_LABELS: Record<OrderStatus, string> = {
  pending: "Aguardando diagnóstico",
  quoted: "Aguardando aprovação",
  approved: "Orçamento aprovado",
  in_progress: "Em reparo",
  waiting_parts: "Aguardando peças",
  ready: "Pronto para retirada",
  completed: "Concluído",
  rejected: "Recusado pela assistência",
  cancelled: "Cancelado",
};
export const SYMPTOMS = [
  "Não liga / não carrega",
  "Tela quebrada / sem imagem",
  "Bateria descarrega rápido",
  "Áudio / microfone ruim",
  "Aquecimento excessivo",
  "Contato com líquido",
];
export const CHECKLIST = [
  "Aparelho liga e dá vídeo",
  "Acompanha capa / película",
  "Possui marcas / riscos",
  "Acompanha carregador",
];
