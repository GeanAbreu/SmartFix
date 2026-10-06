"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./support-inbox.module.css";

type Conversation = { clientId: string; clientName: string; lastMessageAt: string; lastMessage: string };
type Message = { id: string; senderRole: "client" | "partner" | "admin"; body: string; createdAt: string };
const dateTime = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default function SupportInbox({ mode }: { mode: "partner" | "admin" }) {
  const base = mode === "partner" ? "/api/partners/support/conversations" : "/api/admin/support/conversations";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const response = await fetch(base, { credentials: "include", cache: "no-store" });
    const result = await readApiResponse<{ conversations: Conversation[] }>(response);
    if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as conversas.");
    setConversations(result.data.conversations);
    setSelectedId((current) => current || result.data.conversations[0]?.clientId || "");
  }, [base]);

  const loadMessages = useCallback(async () => {
    if (!selectedId) { setMessages([]); return; }
    const response = await fetch(`${base}/${encodeURIComponent(selectedId)}/messages`, { credentials: "include", cache: "no-store" });
    const result = await readApiResponse<{ messages: Message[] }>(response);
    if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as mensagens.");
    setMessages(result.data.messages);
  }, [base, selectedId]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try { await loadConversations(); if (active) setError(""); }
      catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar as conversas."); }
      finally { if (active) setLoading(false); }
    }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    async function refresh() {
      try { await loadMessages(); if (active) setError(""); }
      catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a conversa."); }
    }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 10000);
    return () => { active = false; window.clearInterval(timer); };
  }, [loadMessages, selectedId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !selectedId || sending) return;
    setSending(true); setError("");
    try {
      const response = await fetch(`${base}/${encodeURIComponent(selectedId)}/messages`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      const result = await readApiResponse<{ message: Message }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a mensagem.");
      setMessages((current) => [...current, result.data.message]); setDraft("");
      await loadConversations();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a mensagem."); }
    finally { setSending(false); }
  }

  const selected = conversations.find((item) => item.clientId === selectedId);
  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><span>ATENDIMENTO</span><h1>Mensagens recebidas</h1><p>{mode === "partner" ? "Converse com clientes vinculados às suas ordens de serviço." : "Responda às conversas enviadas para a equipe SmartFix."}</p></div>{mode === "admin" && <Link href="/admin/parceiros">Gerenciar parceiros</Link>}</header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <section className={styles.inbox}>
      <aside className={styles.list}><h2>Conversas</h2>{loading ? <p>Carregando…</p> : conversations.length === 0 ? <div className={styles.empty}>Nenhuma mensagem recebida.</div> : conversations.map((conversation) => <button key={conversation.clientId} type="button" className={selectedId === conversation.clientId ? styles.selected : ""} onClick={() => setSelectedId(conversation.clientId)}><strong>{conversation.clientName}</strong><span>{conversation.lastMessage}</span><time>{dateTime(conversation.lastMessageAt)}</time></button>)}</aside>
      <div className={styles.chat}>{selected ? <><div className={styles.chatHeader}><div className={styles.avatar}>{selected.clientName.slice(0, 1).toUpperCase()}</div><div><strong>{selected.clientName}</strong><span>Cliente SmartFix</span></div></div><div className={styles.messages}>{messages.length === 0 ? <div className={styles.empty}>A conversa ainda não possui mensagens.</div> : messages.map((message) => { const mine = message.senderRole !== "client"; return <div key={message.id} className={mine ? styles.sent : styles.received}><p>{message.body}</p><time>{dateTime(message.createdAt)}</time></div>; })}<div ref={bottomRef} /></div><form className={styles.composer} onSubmit={send}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Digite sua resposta…" aria-label="Resposta" /><button disabled={!draft.trim() || sending}>{sending ? "Enviando…" : "Enviar"}</button></form></> : <div className={styles.empty}>Selecione uma conversa para visualizar.</div>}</div>
    </section>
  </div></main>;
}
