"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "../ajuda/help.module.css";

type Message = { id: string; senderRole: "client" | "admin" | "partner"; body: string; createdAt: string };
type Partner = { id: string; name: string };
const formatTime = (value: string) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

export default function ClientMessages() {
  const searchParams = useSearchParams();
  const requestedPartnerId = searchParams.get("partnerId") || "";
  const requestedOrder = searchParams.get("order") || "";
  const [partners, setPartners] = useState<Partner[]>([]);
  const [recipient, setRecipient] = useState(requestedPartnerId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(requestedOrder ? `Olá! Gostaria de falar sobre a O.S. ${requestedOrder.slice(0, 8).toUpperCase()}. ` : "");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function loadRecipients() {
      try {
        const response = await fetch("/api/support/recipients", { credentials: "include", cache: "no-store" });
        const result = await readApiResponse<{ partners: Partner[] }>(response);
        if (!active || !response.ok || !result.success) return;
        setPartners(result.data.partners);
        setRecipient((current) => current && result.data.partners.some(({ id }) => id === current) ? current : (result.data.partners[0]?.id || ""));
      } catch { if (active) setError("Não foi possível carregar as assistências vinculadas às suas O.S."); }
    }
    void loadRecipients();
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async (showLoading = false) => {
    if (!recipient) { setLoading(false); setMessages([]); return; }
    if (showLoading) setLoading(true);
    try {
      const response = await fetch(`/api/support/messages?partnerId=${encodeURIComponent(recipient)}`, { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ messages: Message[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar a conversa.");
      setMessages(result.data.messages); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar a conversa."); }
    finally { setLoading(false); }
  }, [recipient]);

  useEffect(() => {
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !recipient || sending) return;
    setSending(true); setError("");
    try {
      const response = await fetch("/api/support/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, partnerId: recipient }) });
      const result = await readApiResponse<{ message: Message }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a mensagem.");
      setMessages((current) => [...current, result.data.message]); setDraft("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a mensagem."); }
    finally { setSending(false); }
  }

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.intro}><p className={styles.eyebrow}>MENSAGENS</p><h1>Converse com sua assistência</h1><p>Consulte e envie mensagens sobre as Ordens de Serviço vinculadas à assistência selecionada.</p></header>
    <section className={`${styles.panel} ${styles.chat}`} aria-labelledby="chat-title"><div className={styles.chatHeader}><span className={styles.icon}>✉</span><div><p className={styles.eyebrow}>CONVERSAS</p><h2 id="chat-title">Mensagens da O.S.</h2></div></div>
      <div className={styles.recipient}><label htmlFor="chat-recipient">Falar com</label><select id="chat-recipient" value={recipient} onChange={(event) => { setRecipient(event.target.value); setMessages([]); setError(""); setLoading(true); }} disabled={partners.length === 0}><option value="">Selecione uma assistência</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select>{partners.length === 0 && <small>Nenhuma assistência está vinculada às suas O.S. no momento.</small>}</div>
      {recipient && <p className={styles.notice}>Esta conversa reúne as mensagens das suas Ordens de Serviço com a assistência selecionada.</p>}
      <div className={styles.messages} aria-live="polite">{loading ? <p className={styles.empty}>Carregando conversa…</p> : !recipient ? <div className={styles.chatEmpty}><span>💬</span><h3>Selecione uma assistência</h3><p>As conversas ficam disponíveis quando uma assistência está vinculada a uma O.S. sua.</p></div> : messages.length === 0 ? <div className={styles.chatEmpty}><span>💬</span><h3>Inicie uma conversa</h3><p>Envie uma mensagem sobre sua Ordem de Serviço. A resposta da assistência aparecerá aqui.</p></div> : messages.map((message) => <div key={message.id} className={message.senderRole === "client" ? styles.sent : styles.received}>{message.senderRole !== "client" && <strong>{message.senderRole === "partner" ? "Assistência" : "Equipe SmartFix"}</strong>}<p>{message.body}</p><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div>)}<div ref={bottomRef} /></div>
      {error && <div className={styles.error} role="alert">{error} <button type="button" onClick={() => void refresh(true)}>Tentar novamente</button></div>}
      <form className={styles.composer} onSubmit={send}><label htmlFor="support-message" className={styles.srOnly}>Mensagem para a assistência</label><textarea id="support-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Escreva sua mensagem…" disabled={!recipient || sending || loading || Boolean(error)} /><button type="submit" disabled={!recipient || !draft.trim() || sending || loading || Boolean(error)}>{sending ? "Enviando…" : "Enviar"}</button></form>
    </section>
  </div></main>;
}
