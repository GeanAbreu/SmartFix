"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import type { RepairOrder } from "@/src/types/workflow";
import styles from "./reviews.module.css";

type ClientOrder = RepairOrder & { partnerName: string };

async function loadOrders() {
  const response = await fetch("/api/orders", { credentials: "include", cache: "no-store" });
  const result = await readApiResponse<{ orders: ClientOrder[] }>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as avaliações.");
  return result.data.orders;
}

function completedAt(order: ClientOrder) {
  const entry = [...order.history].reverse().find((item) => item.status === "completed");
  return entry?.at || order.createdAt;
}

function stars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function ClientReviews({ initialOrderId }: { initialOrderId: string }) {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(initialOrderId);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setOrders(await loadOrders());
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as avaliações.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => void refresh());
    return () => cancelAnimationFrame(frame);
  }, [refresh]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !rating || busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(selected.id)}`, {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "review", rating, comment: comment.trim() }),
      });
      const result = await readApiResponse<{ order: ClientOrder }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a avaliação.");
      setMessage("Avaliação enviada. Obrigado por compartilhar sua experiência!");
      setRating(0); setComment(""); setSelectedId("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível enviar a avaliação.");
    } finally {
      setBusy(false);
    }
  }

  const eligible = orders.filter((order) => order.status === "completed" && !order.review)
    .sort((a, b) => completedAt(b).localeCompare(completedAt(a)));
  const reviewed = orders.filter((order) => order.review)
    .sort((a, b) => completedAt(b).localeCompare(completedAt(a)));
  const selected = eligible.find((order) => order.id === selectedId) || eligible[0];

  return <main className={styles.page}><div className={styles.inner}>
    <header className={styles.header}><span className={styles.eyebrow}>ÁREA DO CLIENTE</span><h1>Minhas avaliações</h1><p>Avalie assistências após a conclusão do reparo e consulte as avaliações que você já enviou.</p></header>
    <section className={styles.summary} aria-label="Resumo das avaliações"><div><span>Prontas para avaliar</span><strong>{loading ? "—" : eligible.length}</strong></div><div><span>Avaliações enviadas</span><strong>{loading ? "—" : reviewed.length}</strong></div></section>
    {error && <div className={styles.error} role="alert">{error} {loading === false && orders.length === 0 && <button type="button" onClick={() => void refresh()}>Tentar novamente</button>}</div>}
    {message && <p className={styles.message} role="status">{message}</p>}
    <section className={styles.panel} aria-labelledby="pending-title"><div className={styles.panelHeader}><div><span className={styles.eyebrow}>SUA EXPERIÊNCIA</span><h2 id="pending-title">Avaliar assistência</h2></div><span>{loading ? "Carregando..." : `${eligible.length} ${eligible.length === 1 ? "reparo concluído" : "reparos concluídos"}`}</span></div>
      {loading ? <p className={styles.empty} role="status">Carregando reparos...</p> : eligible.length === 0 ? <div className={styles.empty}><span aria-hidden="true">★</span><h3>Nenhuma avaliação pendente</h3><p>Quando uma ordem de serviço for concluída, você poderá avaliar a assistência aqui.</p><Link href="/cliente/ordens">Ver meus reparos →</Link></div>
        : <div className={styles.reviewWorkspace}><div className={styles.orderList}><p>Selecione um reparo concluído</p>{eligible.map((order) => <button type="button" key={order.id} className={selected?.id === order.id ? styles.selectedOrder : ""} aria-pressed={selected?.id === order.id} onClick={() => { setSelectedId(order.id); setRating(0); setComment(""); setError(""); }}><strong>{order.partnerName}</strong><span>{order.device} · O.S. {order.id.slice(0, 8).toUpperCase()}</span><small>Concluído em {new Date(completedAt(order)).toLocaleDateString("pt-BR")}</small></button>)}</div>
          {selected && <form key={selected.id} className={styles.reviewForm} onSubmit={(event) => void submit(event)}><span className={styles.eyebrow}>AVALIAÇÃO DA ASSISTÊNCIA</span><h3>{selected.partnerName}</h3><p>Reparo de {selected.device} · O.S. {selected.id.slice(0, 8).toUpperCase()}</p><fieldset><legend>Como foi sua experiência?</legend><div className={styles.ratingChoices}>{[1, 2, 3, 4, 5].map((value) => <label key={value}><input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} required /><span aria-hidden="true">{rating >= value ? "★" : "☆"}</span><span className={styles.srOnly}>{value} {value === 1 ? "estrela" : "estrelas"}</span></label>)}</div><small>{rating ? `${rating} de 5 estrelas` : "Selecione de 1 a 5 estrelas"}</small></fieldset><label className={styles.commentLabel} htmlFor="review-comment">Conte como foi o atendimento <span>(opcional)</span></label><textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Sua avaliação ajuda outros clientes a escolher uma assistência." /><button className={styles.submit} type="submit" disabled={busy || rating === 0}>{busy ? "Enviando..." : "Enviar avaliação"}</button></form>}
        </div>}
    </section>
    <section className={styles.panel} aria-labelledby="history-title"><div className={styles.panelHeader}><div><span className={styles.eyebrow}>HISTÓRICO</span><h2 id="history-title">Avaliações enviadas</h2></div><span>{loading ? "—" : reviewed.length}</span></div>
      {loading ? <p className={styles.empty} role="status">Carregando histórico...</p> : reviewed.length === 0 ? <p className={styles.empty}>Você ainda não enviou avaliações.</p>
        : <div className={styles.history}>{reviewed.map((order) => <article key={order.id} className={styles.historyCard}><div><span className={styles.ratingDisplay} aria-label={`${order.review!.rating} de 5 estrelas`}>{stars(order.review!.rating)}</span><h3>{order.partnerName}</h3><p>{order.device} · O.S. {order.id.slice(0, 8).toUpperCase()}</p><small>Reparo concluído em {new Date(completedAt(order)).toLocaleDateString("pt-BR")}</small></div>{order.review!.comment && <blockquote>{order.review!.comment}</blockquote>}</article>)}</div>}
    </section>
  </div></main>;
}
