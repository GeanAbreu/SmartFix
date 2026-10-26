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
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/logistics/incidents", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ incidents: Incident[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message);
      setIncidents(result.data.incidents); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar as ocorrências."); }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); const timer = window.setInterval(() => void refresh(), 30_000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [refresh]);
  return <main className={styles.page}><header><div><span>OPERAÇÃO</span><h1>Ocorrências logísticas</h1><p>Entregas que exigem análise humana antes de uma nova tentativa.</p></div><Link href="/admin/parceiros">Voltar ao painel</Link></header>
    {error && <p className={styles.error}>{error}</p>}
    {incidents.length === 0 ? <section className={styles.empty}><h2>Nenhuma ocorrência aberta</h2><p>Falhas, devoluções e estados de reconciliação aparecerão aqui.</p></section>
      : <section className={styles.list}>{incidents.map((item) => <article key={`${item.orderId}-${item.direction}`}><div><small>O.S. {item.orderId} · {item.direction === "pickup" ? "Coleta" : "Devolução"}</small><h2>{item.device}</h2></div><strong>{item.status}</strong><p>{item.error || "O provedor informou uma ocorrência que precisa ser analisada."}</p>{item.lastEventAt && <time>{new Date(item.lastEventAt).toLocaleString("pt-BR")}</time>}{item.trackingUrl && <a href={item.trackingUrl} target="_blank" rel="noreferrer">Abrir rastreamento ↗</a>}</article>)}</section>}
  </main>;
}
