"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./logistica.module.css";

type Incident = { orderId: string; device: string; direction: "pickup" | "return"; status: string;
  error?: string; deliveryId?: string; trackingUrl?: string; lastEventAt?: string };

export default function LogisticsIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/admin/logistics/incidents", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ incidents: Incident[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message);
      setIncidents(result.data.incidents); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar as ocorrências."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(true), 0); const timer = window.setInterval(() => void refresh(), 30_000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [refresh]);
  async function resolve(item: Incident) {
    if (busy) return;
    const note = window.prompt("Descreva a solução aplicada nesta ocorrência:");
    if (!note?.trim()) return;
    if (note.trim().length > 500) { setError("A descrição da solução deve ter no máximo 500 caracteres."); return; }
    const key = `${item.orderId}-${item.direction}`;
    setBusy(key); setError("");
    try {
      const response = await fetch("/api/admin/console/logistics", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logistics-resolve", id: item.orderId, direction: item.direction, note }) });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message);
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível resolver a ocorrência."); }
    finally { setBusy(""); }
  }
  return <main className={styles.page}><header><div><span>OPERAÇÃO</span><h1>Ocorrências logísticas</h1><p>Entregas que exigem análise humana antes de uma nova tentativa.</p></div><Link href="/admin/parceiros">Voltar ao painel</Link></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {loading ? <section className={styles.empty} role="status"><h2>Carregando ocorrências…</h2></section> : incidents.length === 0 ? <section className={styles.empty}><h2>Nenhuma ocorrência aberta</h2><p>Falhas, devoluções e estados de reconciliação aparecerão aqui.</p></section>
      : <section className={styles.list}>{incidents.map((item) => {const key=`${item.orderId}-${item.direction}`;return <article key={key}><div><small>O.S. {item.orderId} · {item.direction === "pickup" ? "Coleta" : "Devolução"}</small><h2>{item.device}</h2></div><strong>{item.status}</strong><p>{item.error || "O provedor informou uma ocorrência que precisa ser analisada."}</p>{item.lastEventAt && <time dateTime={item.lastEventAt}>{new Date(item.lastEventAt).toLocaleString("pt-BR")}</time>}{item.trackingUrl && <a href={item.trackingUrl} target="_blank" rel="noreferrer">Abrir rastreamento ↗</a>}<button type="button" disabled={Boolean(busy)} onClick={() => void resolve(item)}>{busy===key?"Salvando…":"Marcar como resolvida"}</button></article>})}</section>}
  </main>;
}
