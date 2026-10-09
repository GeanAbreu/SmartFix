"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { readApiResponse } from "@/src/services/api-response.service";
import type { OrderStatus } from "@/src/types/workflow";
import styles from "./tracking.module.css";

type PublicTracking = {
  code: string;
  device: string;
  status: OrderStatus;
  statusLabel: string;
  createdAt: string;
  history: { status: OrderStatus; at: string; label: string }[];
  realtime: { url: string; publishableKey: string; topic: string } | null;
};

const dateTime = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function TrackingView({ token }: { token: string }) {
  const [tracking, setTracking] = useState<PublicTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [live, setLive] = useState(false);
  const realtimeUrl = tracking?.realtime?.url;
  const realtimeKey = tracking?.realtime?.publishableKey;
  const realtimeTopic = tracking?.realtime?.topic;

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking/${encodeURIComponent(token)}`, { cache: "no-store", referrerPolicy: "no-referrer" });
      const result = await readApiResponse<{ tracking: PublicTracking }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Link de acompanhamento inválido ou revogado.");
      setTracking(result.data.tracking);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível consultar a ordem.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => void refresh());
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    return () => { window.cancelAnimationFrame(frame); window.clearInterval(timer); };
  }, [refresh]);

  useEffect(() => {
    if (!realtimeUrl || !realtimeKey || !realtimeTopic) return;
    const supabase = createClient(realtimeUrl, realtimeKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    let channel: RealtimeChannel | null = supabase.channel(realtimeTopic);
    channel
      .on("broadcast", { event: "changed" }, () => void refresh())
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      if (channel) void supabase.removeChannel(channel);
      channel = null;
    };
  }, [realtimeKey, realtimeTopic, realtimeUrl, refresh]);

  return <main className={styles.page}>
    <section className={styles.card}>
      <header><Link href="/" aria-label="Página inicial da SmartFix"><strong>Smart<span>Fix</span></strong></Link><small>ACOMPANHAMENTO SEGURO</small></header>
      {loading ? <p className={styles.state} role="status">Consultando a ordem…</p> : error || !tracking ? <div className={styles.state} role="alert"><h1>Link indisponível</h1><p>{error}</p><small>Peça ao responsável pela ordem um novo link de acompanhamento.</small></div> : <>
        <div className={styles.heading}><div><p>O.S. {tracking.code}</p><h1>{tracking.device}</h1><span>Aberta em {dateTime(tracking.createdAt)}</span></div><strong className={styles.badge}>{tracking.statusLabel}</strong></div>
        <section className={styles.current}><span aria-hidden="true">✓</span><div><small>STATUS ATUAL</small><h2>{tracking.statusLabel}</h2><p aria-live="polite">{live ? "Atualizações em tempo real conectadas." : "Atualização automática ativa."}</p></div></section>
        <section className={styles.timeline}><h2>Histórico da ordem</h2><ol>{tracking.history.map((item, index) => <li key={`${item.status}-${item.at}-${index}`}><span aria-hidden="true" /><div><strong>{item.label}</strong><time dateTime={item.at}>{dateTime(item.at)}</time></div></li>)}</ol></section>
        <footer><span>🔒</span><p>Este link permite apenas consulta. Dados pessoais, pagamento, endereço e ações sobre a ordem não são exibidos.</p></footer>
      </>}
    </section>
  </main>;
}
