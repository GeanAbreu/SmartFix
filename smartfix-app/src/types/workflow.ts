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
export type ServiceDetails = {
  estimatedDays: number;
  warrantyDays: number;
  warrantyStartsAt?: string;
  warrantyEndsAt?: string;
  deliveredAt?: string;
  completionMethod?: "client_confirmation";
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
  paymentProvider?: "infinitepay";
  paymentExpiresAt?: string;
  paymentPreferenceId?: string;
  paymentCheckoutUrl?: string;
  paymentCheckoutFingerprint?: string;
  paymentId?: string;
  paymentReceiptUrl?: string;
  marketplaceFeeCents?: number;
  partnerGrossCents?: number;
  payoutFeeCents?: number;
  payoutNetCents?: number;
  payoutStatus?: "pending" | "paid";
  payoutPaidAt?: string;
  payoutReference?: string;
  technicianName?: string;
  promisedDate?: string;
  internalNotes?: string;
  rejectionReason?: string;
  cancellationRequestedAt?: string;
  cancellationReason?: string;
  refundStatus?: "pending" | "partial" | "processed" | "failed";
  refundId?: string;
  refundAmountCents?: number;
  refundedAt?: string;
  auditTrail?: Array<{
    at: string;
    actorId: string;
    actorRole: string;
    action: string;
    fromStatus?: OrderStatus;
    toStatus?: OrderStatus;
  }>;
  warrantyClaim?: {
    status: "requested" | "accepted" | "rejected";
    reason: string;
    photos?: string[];
    requestedAt: string;
    decidedAt?: string;
    response?: string;
  };
};
export type RepairOrder = {
  id: string;
  clientId: string;
  partnerId: string;
  deviceId: string;
  device: string;
  deviceDetails?: {
    type: string;
    brand: string;
    model: string;
    color: string;
    photos: string[];
  };
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
  kind: "order" | "notification" | "reset" | "google" | "service" | "order_message";
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
