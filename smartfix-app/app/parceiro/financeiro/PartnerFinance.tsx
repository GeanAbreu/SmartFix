"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import { summarizePartnerFinance } from "@/src/services/partner-dashboard.service";
import { ORDER_LABELS, type RepairOrder } from "@/src/types/workflow";
import styles from "./finance.module.css";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const totalFor = (order: RepairOrder) => order.quote.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, order.serviceDetails.deliveryFeeCents - order.serviceDetails.discountCents);

export default function PartnerFinance() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending">("all");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/orders", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ orders: RepairOrder[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar o financeiro.");
      setOrders(result.data.orders);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar o financeiro."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/orders", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<{ orders: RepairOrder[] }>(response);
        if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar o financeiro.");
        if (active) setOrders(result.data.orders);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar o financeiro."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const finance = summarizePartnerFinance(orders);
  const entries = useMemo(() => orders.filter((order) => !["pending", "cancelled", "rejected"].includes(order.status)).filter((order) => filter === "all" || (filter === "confirmed" ? order.serviceDetails.paymentStatus === "confirmed" : order.serviceDetails.paymentStatus !== "confirmed")), [orders, filter]);

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><span>GESTÃO FINANCEIRA</span><h1>Financeiro</h1><p>Acompanhe recebimentos e valores em aberto das suas ordens.</p></div><button onClick={() => void load()} disabled={loading}>{loading ? "Atualizando…" : "Atualizar"}</button></header>
    {error && <div className={styles.error} role="alert">{error} <button onClick={() => void load()}>Tentar novamente</button></div>}
    <section className={styles.metrics} aria-label="Resumo financeiro">
      <article className={styles.highlight}><span>Total recebido</span><strong>{loading ? "—" : money.format(finance.receivedCents / 100)}</strong><small>{finance.paidOrders} pagamento{finance.paidOrders === 1 ? "" : "s"} confirmado{finance.paidOrders === 1 ? "" : "s"}</small></article>
      <article><span>A receber</span><strong>{loading ? "—" : money.format(finance.pendingCents / 100)}</strong><small>{finance.pendingOrders} ordem{finance.pendingOrders === 1 ? "" : "s"} em aberto</small></article>
      <article><span>Volume orçado</span><strong>{loading ? "—" : money.format(finance.grossCents / 100)}</strong><small>Recebido + valores em aberto</small></article>
      <article><span>Ticket médio</span><strong>{loading ? "—" : money.format(finance.averageTicketCents / 100)}</strong><small>Sobre pagamentos confirmados</small></article>
    </section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Movimentações por ordem</h2><p>Os valores consideram itens, entrega e descontos do orçamento.</p></div><div className={styles.filters} role="group" aria-label="Filtrar movimentações">{([['all','Todas'],['confirmed','Recebidas'],['pending','Em aberto']] as const).map(([value,label]) => <button key={value} className={filter === value ? styles.active : ""} onClick={() => setFilter(value)}>{label}</button>)}</div></div>
      {loading ? <p className={styles.empty}>Carregando movimentações…</p> : entries.length === 0 ? <p className={styles.empty}>Nenhuma movimentação encontrada neste filtro.</p> : <div className={styles.tableWrap}><table><thead><tr><th>Ordem</th><th>Cliente / aparelho</th><th>Status</th><th>Pagamento</th><th>Data</th><th>Valor</th></tr></thead><tbody>{entries.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td><strong>{order.clientName || "Cliente"}</strong><small>{order.device}</small></td><td>{ORDER_LABELS[order.status]}</td><td><span className={order.serviceDetails.paymentStatus === "confirmed" ? styles.paid : styles.pending}>{order.serviceDetails.paymentStatus === "confirmed" ? "Recebido" : "Em aberto"}</span></td><td>{date.format(new Date(order.serviceDetails.paidAt || order.createdAt))}</td><td><strong>{money.format(totalFor(order) / 100)}</strong></td></tr>)}</tbody></table></div>}
    </section>
  </div></main>;
}
