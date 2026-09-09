export type OrderStatus =
  | "pending"
  | "quoted"
  | "approved"
  | "in_progress"
  | "waiting_parts"
  | "ready"
  | "completed"
  | "cancelled";
export type QuoteItem = {
  name: string;
  quantity: number;
  unitPriceCents: number;
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
  history: { status: OrderStatus; at: string }[];
  review: { rating: number; comment: string } | null;
  createdAt: string;
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
