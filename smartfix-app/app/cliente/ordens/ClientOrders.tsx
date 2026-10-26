"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import { ORDER_LABELS, type OrderStatus, type RepairOrder } from "@/src/types/workflow";
import styles from "./orders.module.css";
import integratedStyles from "./prototype-integration.module.css";
import OrderCheckout from "./OrderCheckout";
import TrackingCode from "./TrackingCode";
import ConfirmDialog from "@/app/cliente/components/ConfirmDialog";

type ClientOrder = RepairOrder & { totalCents: number; partnerName?: string };
type Filter = "all" | "active" | "quoted" | "completed" | "cancelled";
const activeStatuses = new Set<OrderStatus>(["pending", "quoted", "approved", "in_progress", "waiting_parts", "ready"]);
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const date = (value: string) => new Date(value).toLocaleDateString("pt-BR");
const dateTime = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function statusClass(status: OrderStatus) {
  if (status === "quoted" || status === "ready") return styles.attention;
  if (status === "completed") return styles.completed;
  if (status === "cancelled" || status === "rejected") return styles.cancelled;
  return styles.active;
}

function nextStep(order: ClientOrder) {
  switch (order.status) {
    case "pending": return "A assistência vai avaliar o dispositivo e preparar o orçamento.";
    case "quoted": return "Revise os itens e aprove o orçamento para autorizar o reparo.";
    case "approved": return "Orçamento aprovado. Aguarde o início do serviço pela assistência.";
    case "in_progress": return "A assistência está trabalhando no seu dispositivo.";
    case "waiting_parts": return "O serviço aguarda peças para continuar.";
    case "ready": return "Seu dispositivo está pronto. Agende a devolução ou confirme a retirada presencial.";
    case "completed": return order.review ? "Reparo entregue e avaliado." : "Aparelho entregue. Sua garantia já começou.";
    case "rejected": return "A assistência não conseguiu atender esta solicitação. Consulte o motivo e escolha outra assistência.";
    case "cancelled": return "Esta solicitação foi cancelada.";
  }
}

async function getOrders() {
  const response = await fetch("/api/orders", { credentials: "include", cache: "no-store" });
  const result = await readApiResponse<{ orders: ClientOrder[] }>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os reparos.");
  return result.data.orders;
}

export default function ClientOrders({ initialQuery }: { initialQuery: string }) {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(initialQuery || null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [pendingCancel, setPendingCancel] = useState<ClientOrder | null>(null);
  const [pendingReceipt, setPendingReceipt] = useState<ClientOrder | null>(null);

  const refresh = useCallback(async () => {
    try { setOrders(await getOrders()); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar os reparos."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    return () => { cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [refresh]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get("payment_id");
    if (!paymentId || params.get("payment") !== "success") return;
    void fetch(`/api/payments/mercado-pago/confirm?paymentId=${encodeURIComponent(paymentId)}`, {
      credentials: "include", cache: "no-store",
    }).then(async (response) => {
      const result = await readApiResponse<{ confirmed: boolean }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível confirmar o pagamento.");
      setNotice("Pagamento confirmado. A assistência já pode iniciar o reparo.");
      await refresh();
      window.history.replaceState(null, "", "/cliente/ordens");
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Não foi possível confirmar o pagamento."));
  }, [refresh]);

  async function act(order: ClientOrder, action: "approve" | "cancel", approval?: Record<string, unknown>) {
    setBusyId(order.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approval || { action }),
      });
      const result = await readApiResponse<{ order: ClientOrder }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível atualizar o reparo.");
      setNotice(action === "approve" ? "Orçamento aprovado. A assistência já pode iniciar o reparo." : "Solicitação cancelada.");
      if (action === "cancel") setPendingCancel(null);
      if (action === "approve") setCheckoutId(null);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o reparo."); }
    finally { setBusyId(null); }
  }

  async function scheduleReturn(order: ClientOrder, scheduledDate: string, schedulePeriod: string) {
    setBusyId(order.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}/logistics`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction: "return", scheduledDate, schedulePeriod }),
      });
      const result = await readApiResponse<{ delivery: unknown }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível agendar a devolução.");
      setNotice("Devolução agendada. Você poderá acompanhar o motoboy por aqui.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível agendar a devolução."); }
    finally { setBusyId(null); }
  }

  async function confirmReceipt(order: ClientOrder) {
    setBusyId(order.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_receipt" }),
      });
      const result = await readApiResponse<{ order: ClientOrder }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível confirmar o recebimento.");
      setPendingReceipt(null); setNotice("Recebimento confirmado. Sua garantia já está valendo.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível confirmar o recebimento."); }
    finally { setBusyId(null); }
  }

  async function requestPaidCancellation(order: ClientOrder, reason: string) {
    setBusyId(order.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_cancellation", reason }),
      });
      const result = await readApiResponse<{ order: ClientOrder }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível solicitar o cancelamento.");
      setNotice("Cancelamento solicitado. A equipe analisará o reembolso antes da coleta.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível solicitar o cancelamento."); }
    finally { setBusyId(null); }
  }

  const counts = useMemo(() => ({
    active: orders.filter((order) => activeStatuses.has(order.status)).length,
    quoted: orders.filter((order) => order.status === "quoted").length,
    completed: orders.filter((order) => order.status === "completed").length,
  }), [orders]);

  const visible = useMemo(() => orders.filter((order) => {
    if (filter === "active" && !activeStatuses.has(order.status)) return false;
    if (filter === "cancelled" && !["cancelled", "rejected"].includes(order.status)) return false;
    if (filter !== "all" && filter !== "active" && filter !== "cancelled" && order.status !== filter) return false;
    const text = `${order.device} ${order.id} ${order.partnerName || ""} ${ORDER_LABELS[order.status]} ${order.problem}`.toLocaleLowerCase("pt-BR");
    return text.includes(query.trim().toLocaleLowerCase("pt-BR"));
  }), [orders, filter, query]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" }, { key: "active", label: "Em andamento" },
    { key: "quoted", label: "Aguardando aprovação" }, { key: "completed", label: "Concluídos" },
    { key: "cancelled", label: "Cancelados / recusados" },
  ];

  return <main className={styles.page}><div className={styles.content}>
    <header className={styles.header}><div><span className={styles.eyebrow}>ÁREA DO CLIENTE</span><h1>Meus reparos</h1><p>Acompanhe suas solicitações, revise orçamentos e consulte o histórico de cada serviço.</p></div><Link className={styles.primary} href="/cliente/solicitar-reparo">+ Solicitar reparo</Link></header>

    <section className={styles.summary} aria-label="Resumo dos reparos">
      <div><span>Em andamento</span><strong>{loading || error ? "—" : counts.active}</strong><small>Solicitações ativas</small></div>
      <div><span>Aguardando aprovação</span><strong>{loading || error ? "—" : counts.quoted}</strong><small>Orçamentos para revisar</small></div>
      <div><span>Concluídos</span><strong>{loading || error ? "—" : counts.completed}</strong><small>Serviços finalizados</small></div>
    </section>

    {notice && <p className={styles.success} role="status">{notice}</p>}
    {error && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => void refresh()}>Tentar novamente</button></div>}

    <section className={styles.listSection} aria-labelledby="orders-title">
      <div className={styles.listHeading}><div><span className={styles.eyebrow}>SUAS SOLICITAÇÕES</span><h2 id="orders-title">Histórico de reparos</h2></div><span>{loading ? "Carregando…" : `${visible.length} ${visible.length === 1 ? "reparo" : "reparos"}`}</span></div>
      <div className={styles.toolbar}><div className={styles.filters} role="group" aria-label="Filtrar reparos por status">{filters.map(({ key, label }) => <button key={key} type="button" className={filter === key ? styles.selectedFilter : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><label className={styles.search}><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aparelho ou O.S." aria-label="Buscar reparos" /></label></div>
      {loading ? <p className={styles.empty} role="status">Carregando reparos…</p> : error && orders.length === 0 ? null : orders.length === 0 ? <div className={styles.empty}><span aria-hidden="true">▣</span><h3>Você ainda não solicitou reparos</h3><p>Quando solicitar um serviço, poderá acompanhar todas as etapas aqui.</p><Link className={styles.primary} href="/cliente/solicitar-reparo">Solicitar meu primeiro reparo</Link></div> : visible.length === 0 ? <div className={styles.empty}><h3>Nenhum reparo encontrado</h3><p>Tente outra busca ou escolha um filtro diferente.</p><button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Limpar filtros</button></div> : <div className={styles.cards}>{visible.map((order) => {
        const expanded = expandedId === order.id;
        const canCancel = order.status === "pending" || order.status === "quoted";
        return <article key={order.id} className={styles.card} id={order.id}>
          <div className={styles.cardTop}><div className={styles.deviceIcon} aria-hidden="true">▣</div><div className={styles.cardIdentity}><span className={styles.code}>O.S. {order.id.slice(0, 8).toUpperCase()} · {date(order.createdAt)}</span><h3>{order.device}</h3><p>{order.partnerName || "Assistência parceira"}</p></div><span className={`${styles.badge} ${statusClass(order.status)}`}>{ORDER_LABELS[order.status]}</span></div>
          <p className={styles.nextStep}>{nextStep(order)}</p>
          <div className={styles.cardActions}>{order.status === "quoted" && <button type="button" className={styles.primaryButton} disabled={busyId !== null} onClick={() => setExpandedId(order.id)}>Revisar orçamento · {money(order.totalCents)}</button>}{order.status === "completed" && !order.review && <Link className={styles.primary} href={`/cliente/avaliacoes?order=${encodeURIComponent(order.id)}`}>Avaliar reparo</Link>}<button type="button" className={styles.detailsButton} aria-expanded={expanded} aria-controls={`details-${order.id}`} onClick={() => setExpandedId(expanded ? null : order.id)}>{expanded ? "Ocultar detalhes" : "Ver detalhes"} <span aria-hidden="true">{expanded ? "↑" : "→"}</span></button></div>
          {expanded && <div id={`details-${order.id}`} className={styles.details}><div className={styles.detailsGrid}><section><h4>Problema informado</h4><p>{order.problem}</p>{order.symptoms.length > 0 && <p className={styles.subtle}>Sintomas: {order.symptoms.join(" · ")}</p>}{order.checklist.length > 0 && <p className={styles.subtle}>Informações do aparelho: {order.checklist.join(" · ")}</p>}{order.diagnosis && <><h4>Diagnóstico da assistência</h4><p>{order.diagnosis}</p></>}{order.status === "rejected" && order.serviceDetails.rejectionReason && <><h4>Motivo da recusa</h4><p>{order.serviceDetails.rejectionReason}</p></>}</section><section><h4>Andamento</h4><ol className={styles.timeline}>{order.history.map((item, index) => <li key={`${item.status}-${index}`}><strong>{ORDER_LABELS[item.status]}</strong><time dateTime={item.at}>{dateTime(item.at)}</time></li>)}</ol></section></div>
            {order.quote.length > 0 && <section className={styles.quote}><div className={styles.quoteHeading}><div><h4>Orçamento detalhado</h4><small>{order.serviceDetails.estimatedDays} dias úteis · {order.serviceDetails.warrantyDays} dias de garantia</small></div><strong>{money(order.totalCents)}</strong></div><div className={styles.quoteItems}>{order.quote.map((item, index) => <div key={`${item.name}-${index}`}><span><b>{item.category === "part" ? "Peça" : "Mão de obra"} · {item.name}</b>{item.details && <small>{item.details}</small>}<small>{item.quantity} × {money(item.unitPriceCents)}</small></span><strong>{money(item.quantity * item.unitPriceCents)}</strong></div>)}</div>{order.serviceDetails.deliveryFeeCents > 0 && <div className={integratedStyles.quoteExtra}><span>Coleta e entrega</span><strong>{money(order.serviceDetails.deliveryFeeCents)}</strong></div>}{order.serviceDetails.discountCents > 0 && <div className={integratedStyles.quoteExtra}><span>Desconto {order.serviceDetails.couponCode}</span><strong>− {money(order.serviceDetails.discountCents)}</strong></div>}{order.status === "quoted" && <p>O reparo só começa após sua confirmação de agendamento e pagamento.</p>}</section>}
            {checkoutId === order.id && order.status === "quoted" ? <OrderCheckout order={order} busy={busyId === order.id} onCancel={() => setCheckoutId(null)} /> : <div className={styles.detailActions}>{order.status === "quoted" && <button type="button" className={styles.primaryButton} disabled={busyId !== null} onClick={() => setCheckoutId(order.id)}>{`Confirmar agendamento e pagar · ${money(order.totalCents)}`}</button>}{canCancel && <button type="button" className={styles.cancelButton} disabled={busyId !== null} onClick={() => setPendingCancel(order)}>Cancelar solicitação</button>}<Link href={`/cliente/ajuda?partnerId=${encodeURIComponent(order.partnerId)}&order=${encodeURIComponent(order.id)}`}>Falar sobre esta ordem →</Link></div>}
            {order.serviceDetails.paymentStatus === "confirmed" && <section className={integratedStyles.receipt}><div><span className={styles.eyebrow}>COMPROVANTE</span><h4>Pagamento confirmado</h4><p>{order.serviceDetails.paymentMethod === "pix" ? "PIX" : "Cartão"} · {dateTime(order.serviceDetails.paidAt)}</p></div><div><strong>{money(order.totalCents)}</strong><small>{order.serviceDetails.scheduledDate.split("-").reverse().join("/")} · {order.serviceDetails.schedulePeriod === "morning" ? "Manhã" : "Tarde"}</small></div><p>{order.serviceDetails.serviceAddress}</p></section>}
            {(order.serviceDetails.logistics || order.status === "ready") && <section className={styles.quote}><h4>Coleta e entrega</h4><p>As entregas usam foto na coleta e PIN no recebimento.</p>{(["pickup", "return"] as const).map((direction) => { const leg = order.serviceDetails.logistics?.[direction]; if (!leg) return null; return <div className={integratedStyles.quoteExtra} key={direction}><span>{direction === "pickup" ? "Cliente → assistência" : "Assistência → cliente"} · {leg.status}</span>{leg.trackingUrl ? <a href={leg.trackingUrl} target="_blank" rel="noreferrer">Acompanhar ↗</a> : <strong>Preparando</strong>}</div>; })}{order.status === "ready" && !order.serviceDetails.logistics?.return?.deliveryId && <form className={integratedStyles.checkoutGrid} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void scheduleReturn(order, String(data.get("scheduledDate")), String(data.get("schedulePeriod"))); }}><label>Data da devolução<input name="scheduledDate" type="date" required /></label><label>Turno<select name="schedulePeriod" defaultValue="morning"><option value="morning">Manhã · 08h às 12h</option><option value="afternoon">Tarde · 13h às 18h</option></select></label><button className={styles.primaryButton} disabled={busyId !== null}>Agendar entrega</button><button type="button" className={styles.detailsButton} disabled={busyId !== null} onClick={() => setPendingReceipt(order)}>Já retirei presencialmente</button></form>}{order.status === "completed" && order.serviceDetails.warrantyEndsAt && <p>Garantia válida até {date(order.serviceDetails.warrantyEndsAt)}.</p>}</section>}
            {order.status === "approved" && !order.serviceDetails.logistics?.pickup?.deliveryId && (order.serviceDetails.cancellationRequestedAt ? <p className={styles.nextStep}>Cancelamento e reembolso em análise pela equipe SmartFix.</p> : <form className={integratedStyles.checkout} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void requestPaidCancellation(order, String(data.get("reason"))); }}><h4>Precisa cancelar?</h4><label>Explique o motivo<textarea name="reason" minLength={10} maxLength={1000} required /></label><button className={styles.cancelButton} disabled={busyId !== null}>Solicitar cancelamento e reembolso</button></form>)}
            <TrackingCode orderId={order.id} device={order.device} />
          </div>}
        </article>;
      })}</div>}
    </section>
    <ConfirmDialog open={pendingCancel !== null} title="Cancelar solicitação?" message={`A O.S. de ${pendingCancel?.device || "este dispositivo"} será cancelada e não poderá continuar para o reparo.`} confirmLabel="Cancelar solicitação" busyLabel="Cancelando..." busy={busyId === pendingCancel?.id} onCancel={() => { if (!busyId) setPendingCancel(null); }} onConfirm={() => { if (pendingCancel) void act(pendingCancel, "cancel"); }} />
    <ConfirmDialog open={pendingReceipt !== null} title="Confirmar retirada presencial?" message="Confirme somente se o aparelho já estiver em suas mãos. A O.S. será concluída e a garantia começará agora." confirmLabel="Confirmar recebimento" busyLabel="Confirmando..." busy={busyId === pendingReceipt?.id} onCancel={() => { if (!busyId) setPendingReceipt(null); }} onConfirm={() => { if (pendingReceipt) void confirmReceipt(pendingReceipt); }} />
  </div></main>;
}
