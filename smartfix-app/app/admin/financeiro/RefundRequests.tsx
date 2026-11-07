"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "../logistica/logistica.module.css";

type RefundRequest = { orderId: string; device: string; reason: string; requestedAt?: string; totalCents: number };
const money = (value: number) => (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RefundRequests({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<RefundRequest[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const Heading = embedded ? "h2" : "h1";
  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/admin/payments/refunds", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ requests: RefundRequest[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os reembolsos.");
      setItems(result.data.requests);
      setError(false);
      return true;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível carregar os reembolsos.");
      setError(true);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(true), 0); return () => window.clearTimeout(initial); }, [refresh]);
  async function refund(item: RefundRequest) {
    setBusy(item.orderId); setMessage(""); setError(false);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(item.orderId)}/refund`, { method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: item.reason || "Cancelamento aprovado pela equipe SmartFix." }) });
      const result = await readApiResponse<{ refunded: boolean }>(response);
      if (!response.ok || !result.success) throw new Error(result.message);
      if (await refresh()) setMessage(`Reembolso da O.S. ${item.orderId} processado.`);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Não foi possível processar o reembolso."); setError(true); }
    finally { setBusy(""); }
  }
  const content = <><header><div><span>FINANCEIRO</span><Heading id="refunds-title">Solicitações de reembolso</Heading><p>Revise o motivo antes de devolver o pagamento integral.</p></div>{!embedded && <Link href="/admin/parceiros">Voltar ao painel</Link>}</header>
    {message && <p className={error ? styles.error : styles.success} role={error ? "alert" : "status"}>{message}</p>}
    {loading ? <section className={styles.empty} role="status"><h2>Carregando solicitações…</h2></section> : items.length === 0 ? <section className={styles.empty}><h2>Nenhuma solicitação pendente</h2></section> : <section className={styles.list}>{items.map((item) => <article key={item.orderId}><div><small>O.S. {item.orderId}</small><h2>{item.device}</h2></div><strong>{money(item.totalCents)}</strong><p>{item.reason}</p>{item.requestedAt && <time dateTime={item.requestedAt}>{new Date(item.requestedAt).toLocaleString("pt-BR")}</time>}<button type="button" disabled={Boolean(busy)} onClick={() => void refund(item)}>{busy === item.orderId ? "Processando…" : "Aprovar reembolso integral"}</button></article>)}</section>}
  </>;
  return embedded
    ? <section className={`${styles.page} ${styles.embedded}`} aria-labelledby="refunds-title">{content}</section>
    : <main className={styles.page}>{content}</main>;
}
