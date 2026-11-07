"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./support-inbox.module.css";

type Conversation = { clientId: string; clientName: string; lastMessageAt: string; lastMessage: string };
type Message = { id: string; senderRole: "client" | "partner" | "admin"; body: string; createdAt: string };
const dateTime = (value: string) => new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export default function SupportInbox({ mode }: { mode: "partner" | "admin" }) {
  const base = mode === "partner" ? "/api/partners/support/conversations" : "/api/admin/support/conversations";
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [conversationsError, setConversationsError] = useState("");
  const [messagesError, setMessagesError] = useState("");
  const [sendErrors, setSendErrors] = useState<Record<string, string>>({});
  const selectedIdRef = useRef("");
  const conversationsRequestRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectConversation = useCallback((clientId: string) => {
    if (selectedIdRef.current === clientId) return;
    selectedIdRef.current = clientId;
    setMessages([]);
    setMessagesError("");
    setMessagesLoading(Boolean(clientId));
    setSelectedId(clientId);
  }, []);

  const loadConversations = useCallback(async (showLoading = false) => {
    conversationsRequestRef.current?.abort();
    const controller = new AbortController();
    conversationsRequestRef.current = controller;
    if (showLoading) setConversationsLoading(true);

    try {
      const response = await fetch(base, { credentials: "include", cache: "no-store", signal: controller.signal });
      const result = await readApiResponse<{ conversations: Conversation[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as conversas.");
      if (controller.signal.aborted) return;

      const nextConversations = result.data.conversations;
      setConversations(nextConversations);
      setConversationsError("");

      const currentId = selectedIdRef.current;
      const nextId = nextConversations.some((item) => item.clientId === currentId)
        ? currentId
        : nextConversations[0]?.clientId || "";
      selectConversation(nextId);
    } catch (cause) {
      if (!isAbortError(cause)) {
        setConversationsError(cause instanceof Error ? cause.message : "Não foi possível carregar as conversas.");
      }
    } finally {
      if (conversationsRequestRef.current === controller) {
        conversationsRequestRef.current = null;
        setConversationsLoading(false);
      }
    }
  }, [base, selectConversation]);

  useEffect(() => {
    void loadConversations(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadConversations();
    }, 10000);
    return () => {
      window.clearInterval(timer);
      conversationsRequestRef.current?.abort();
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setMessagesLoading(false);
      return;
    }

    let active = true;
    let request: AbortController | null = null;
    const clientId = selectedId;

    async function refresh(showLoading = false) {
      request?.abort();
      const controller = new AbortController();
      request = controller;
      if (showLoading) setMessagesLoading(true);

      try {
        const response = await fetch(`${base}/${encodeURIComponent(clientId)}/messages`, {
          credentials: "include", cache: "no-store", signal: controller.signal,
        });
        const result = await readApiResponse<{ messages: Message[] }>(response);
        if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as mensagens.");
        if (active && !controller.signal.aborted && selectedIdRef.current === clientId) {
          setMessages(result.data.messages);
          setMessagesError("");
        }
      } catch (cause) {
        if (active && !isAbortError(cause) && selectedIdRef.current === clientId) {
          setMessagesError(cause instanceof Error ? cause.message : "Não foi possível carregar a conversa.");
        }
      } finally {
        if (active && request === controller && selectedIdRef.current === clientId) setMessagesLoading(false);
      }
    }

    void refresh(true);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    return () => {
      active = false;
      window.clearInterval(timer);
      request?.abort();
    };
  }, [base, selectedId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "nearest" }); }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clientId = selectedId;
    const body = (drafts[clientId] || "").trim();
    if (!body || !clientId || sendingId) return;

    setSendingId(clientId);
    setSendErrors((current) => ({ ...current, [clientId]: "" }));
    try {
      const response = await fetch(`${base}/${encodeURIComponent(clientId)}/messages`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
      });
      const result = await readApiResponse<{ message: Message }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a mensagem.");

      setDrafts((current) => {
        const next = { ...current };
        delete next[clientId];
        return next;
      });
      if (selectedIdRef.current === clientId) {
        setMessages((current) => current.some((message) => message.id === result.data.message.id)
          ? current
          : [...current, result.data.message]);
      }
      await loadConversations();
    } catch (cause) {
      setSendErrors((current) => ({
        ...current,
        [clientId]: cause instanceof Error ? cause.message : "Não foi possível enviar a mensagem.",
      }));
    } finally {
      setSendingId((current) => current === clientId ? null : current);
    }
  }

  const selected = conversations.find((item) => item.clientId === selectedId);
  const draft = selectedId ? drafts[selectedId] || "" : "";
  const sendError = selectedId ? sendErrors[selectedId] || "" : "";
  const sendingCurrent = sendingId === selectedId;

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><span>ATENDIMENTO</span><h1>Mensagens recebidas</h1><p>{mode === "partner" ? "Converse com clientes vinculados às suas ordens de serviço." : "Responda às conversas enviadas para a equipe SmartFix."}</p></div>{mode === "admin" && <Link href="/admin/parceiros">Gerenciar parceiros</Link>}</header>
    <section className={styles.inbox}>
      <aside className={styles.list}><h2>Conversas</h2>
        {conversationsError && <p className={styles.error} role="alert">{conversationsError}</p>}
        {conversationsLoading && conversations.length === 0 ? <p role="status">Carregando…</p>
          : conversations.length === 0 ? <div className={styles.empty}>Nenhuma mensagem recebida.</div>
          : conversations.map((conversation) => <button key={conversation.clientId} type="button" className={selectedId === conversation.clientId ? styles.selected : ""} aria-current={selectedId === conversation.clientId ? "true" : undefined} onClick={() => selectConversation(conversation.clientId)}><strong>{conversation.clientName}</strong><span>{conversation.lastMessage}</span><time dateTime={conversation.lastMessageAt}>{dateTime(conversation.lastMessageAt)}</time></button>)}
      </aside>
      <div className={styles.chat}>{selected ? <>
        <div className={styles.chatHeader}><div className={styles.avatar}>{selected.clientName.slice(0, 1).toUpperCase()}</div><div><strong>{selected.clientName}</strong><span>Cliente SmartFix</span></div></div>
        {messagesError && <p className={styles.error} role="alert">{messagesError}</p>}
        <div className={styles.messages}>{messagesLoading && messages.length === 0 ? <div className={styles.empty} role="status">Carregando conversa…</div>
          : messages.length === 0 ? <div className={styles.empty}>A conversa ainda não possui mensagens.</div>
          : messages.map((message) => { const mine = message.senderRole !== "client"; return <div key={message.id} className={mine ? styles.sent : styles.received}><p>{message.body}</p><time dateTime={message.createdAt}>{dateTime(message.createdAt)}</time></div>; })}<div ref={bottomRef} /></div>
        {sendError && <p className={styles.error} role="alert">{sendError}</p>}
        <form className={styles.composer} onSubmit={send}><textarea value={draft} onChange={(event) => setDrafts((current) => ({ ...current, [selectedId]: event.target.value }))} maxLength={2000} rows={2} placeholder="Digite sua resposta…" aria-label={`Resposta para ${selected.clientName}`} /><button disabled={!draft.trim() || Boolean(sendingId)}>{sendingCurrent ? "Enviando…" : sendingId ? "Aguarde…" : "Enviar"}</button></form>
      </> : <div className={styles.empty}>{conversationsLoading ? "Carregando conversas…" : "Selecione uma conversa para visualizar."}</div>}</div>
    </section>
  </div></main>;
}
