"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./order-chat.module.css";

type Message = { id: string; data: { senderRole: "client" | "partner"; message: string; createdAt: string } };

export default function OrderChat({ orderId, audience }: { orderId: string; audience: "client" | "partner" }) {
  const [open, setOpen] = useState(false); const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState(""); const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const load = useCallback(async () => {
    try { const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/messages`, { credentials: "include", cache: "no-store" }); const result = await readApiResponse<{ messages: Message[] }>(response); if (!response.ok || !result.success) throw new Error(result.message); setMessages(result.data.messages); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o chat."); }
  }, [orderId]);
  useEffect(() => { if (!open) return; const frame = requestAnimationFrame(() => void load()); const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 2000); return () => { cancelAnimationFrame(frame); window.clearInterval(timer); }; }, [open, load]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const message = String(new FormData(form).get("message") || "").trim(); if (!message) return; setSending(true); try { const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/messages`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }); const result = await readApiResponse(response); if (!response.ok || !result.success) throw new Error(result.message); form.reset(); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a mensagem."); } finally { setSending(false); } }
  const recipient = audience === "client" ? "a assistência" : "o cliente";
  return <section className={styles.chat}><button type="button" className={styles.toggle} onClick={() => setOpen((value) => !value)}>{open ? "Fechar conversa" : `Enviar mensagem para ${recipient}`}</button>{open && <div className={styles.panel}><header><strong>Chat da O.S. #{orderId}</strong><span>Atualização automática</span></header><div className={styles.messages}>{messages.length === 0 && <p>Envie a primeira mensagem sobre este reparo.</p>}{messages.map((item) => <article key={item.id} className={item.data.senderRole === audience ? styles.mine : styles.theirs}><strong>{item.data.senderRole === "client" ? "Cliente" : "Assistência"}</strong><p>{item.data.message}</p><time>{new Date(item.data.createdAt).toLocaleString("pt-BR")}</time></article>)}<div ref={endRef}/></div>{error && <p className={styles.error}>{error}</p>}<form onSubmit={send}><label className="sr-only" htmlFor={`chat-${orderId}`}>Mensagem</label><input id={`chat-${orderId}`} name="message" maxLength={2000} required placeholder="Digite uma mensagem…"/><button disabled={sending}>{sending ? "Enviando…" : "Enviar"}</button></form></div>}</section>;
}
