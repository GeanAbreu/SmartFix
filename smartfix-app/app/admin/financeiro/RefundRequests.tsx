"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "../logistica/logistica.module.css";

type RefundRequest = { orderId: string; device: string; reason: string; requestedAt?: string; totalCents: number };
const money = (value: number) => (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RefundRequests() {
  const [items, setItems] = useState<RefundRequest[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/payments/refunds", { credentials: "include", cache: "no-store" });
    const result = await readApiResponse<{ requests: RefundRequest[] }>(response);
    if (response.ok && result.success) setItems(result.data.requests); else setMessage(result.message || "Não foi possível carregar os reembolsos.");
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(initial); }, [refresh]);
  async function refund(item: RefundRequest) {
    setBusy(item.orderId); setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(item.orderId)}/refund`, { method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: item.reason || "Cancelamento aprovado pela equipe SmartFix." }) });
      const result = await readApiResponse<{ refunded: boolean }>(response);
      if (!response.ok || !result.success) throw new Error(result.message);
      setMessage(`Reembolso da O.S. ${item.orderId} processado.`); await refresh();
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível processar o reembolso."); }
    finally { setBusy(""); }
  }
  return <main className={styles.page}><header><div><span>FINANCEIRO</span><h1>Solicitações de reembolso</h1><p>Revise o motivo antes de devolver o pagamento integral.</p></div><Link href="/admin/parceiros">Voltar ao painel</Link></header>
    {message && <p className={styles.error}>{message}</p>}
    {items.length === 0 ? <section className={styles.empty}><h2>Nenhuma solicitação pendente</h2></section> : <section className={styles.list}>{items.map((item) => <article key={item.orderId}><div><small>O.S. {item.orderId}</small><h2>{item.device}</h2></div><strong>{money(item.totalCents)}</strong><p>{item.reason}</p>{item.requestedAt && <time>{new Date(item.requestedAt).toLocaleString("pt-BR")}</time>}<button disabled={Boolean(busy)} onClick={() => void refund(item)}>{busy === item.orderId ? "Processando..." : "Aprovar reembolso integral"}</button></article>)}</section>}
  </main>;
}
