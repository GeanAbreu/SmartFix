"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./help.module.css";

const faqs = [
  { question: "Como solicito um reparo?", answer: "Acesse Solicitar reparo, escolha seu dispositivo e descreva o problema. Depois, acompanhe a solicitação em Meus reparos." },
  { question: "Como acompanho o reparo?", answer: "Acesse Meus reparos para consultar as atualizações da sua solicitação." },
  { question: "Quando recebo o orçamento?", answer: "A assistência prepara o orçamento após o diagnóstico. O reparo começa somente depois da sua aprovação." },
  { question: "Posso cancelar a solicitação?", answer: "Você pode cancelar até aprovar o orçamento. Solicite o cancelamento pelo chat com a SmartFix ou com a assistência responsável." },
  { question: "Qual é a garantia do serviço?", answer: "A assistência informa as condições de garantia de cada serviço. Confira essas condições antes de aprovar o orçamento." },
] as const;
type Message = { id: string; senderRole: "client" | "admin" | "partner"; body: string; createdAt: string };
type Partner = { id: string; name: string };
function time(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [recipient, setRecipient] = useState("smartfix");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const filteredFaqs = useMemo(() => faqs.filter(({ question, answer }) => `${question} ${answer}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))), [search]);
  const partnerId = recipient === "smartfix" ? null : recipient;

  useEffect(() => {
    let active = true;
    async function loadRecipients() {
      try {
        const response = await fetch("/api/support/recipients", { credentials: "include", cache: "no-store" });
        const result = await readApiResponse<{ partners: Partner[] }>(response);
        if (active && response.ok && result.success) setPartners(result.data.partners);
      } catch { /* The message request displays connectivity errors. */ }
    }
    void loadRecipients();
    return () => { active = false; };
  }, []);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const query = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
      const response = await fetch(`/api/support/messages${query}`, { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ messages: Message[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar a conversa.");
      setMessages(result.data.messages);
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar a conversa."); }
    finally { setLoading(false); }
  }, [partnerId]);

  useEffect(() => {
    const initial = window.setTimeout(() => { void refresh(); }, 0);
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 15000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages.length]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true); setError("");
    try {
      const response = await fetch("/api/support/messages", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, partnerId }) });
      const result = await readApiResponse<{ message: Message }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a mensagem.");
      setMessages((current) => [...current, result.data.message]); setDraft("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível enviar a mensagem."); }
    finally { setSending(false); }
  }

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.intro}><p className={styles.eyebrow}>CENTRAL DE AJUDA</p><h1>Como podemos ajudar?</h1><p>Encontre respostas, consulte os contatos ou converse com um atendente.</p></header>
    <div className={styles.layout}><div className={styles.leftColumn}>
      <section className={styles.panel} aria-labelledby="faq-title"><div className={styles.heading}><span className={styles.icon}>?</span><div><p className={styles.eyebrow}>RESPOSTAS RÁPIDAS</p><h2 id="faq-title">Perguntas frequentes</h2></div></div>
        <label className={styles.search}><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busque por uma dúvida" aria-label="Buscar perguntas frequentes" /></label>
        <div className={styles.faqs}>{filteredFaqs.length === 0 ? <p className={styles.empty}>Nenhuma pergunta encontrada.</p> : filteredFaqs.map(({ question, answer }) => <div key={question} className={styles.faq}><button type="button" aria-expanded={openFaq === question} onClick={() => setOpenFaq(openFaq === question ? null : question)}><span>{question}</span><b aria-hidden="true">{openFaq === question ? "−" : "+"}</b></button>{openFaq === question && <p>{answer}</p>}</div>)}</div>
      </section>
      <section className={styles.panel} aria-labelledby="contact-title"><div className={styles.heading}><span className={styles.icon}>☎</span><div><p className={styles.eyebrow}>OUTROS CANAIS</p><h2 id="contact-title">Contato</h2></div></div><p className={styles.description}>Os canais oficiais serão publicados aqui assim que estiverem definidos.</p><dl className={styles.contacts}><div><dt>Telefone local</dt><dd>A definir</dd></div><div><dt>Telefone interlocal</dt><dd>A definir</dd></div><div><dt>E-mail</dt><dd>A definir</dd></div></dl></section>
    </div>
    <section className={`${styles.panel} ${styles.chat}`} aria-labelledby="chat-title"><div className={styles.chatHeader}><span className={styles.icon}>✉</span><div><p className={styles.eyebrow}>ATENDIMENTO HUMANO</p><h2 id="chat-title">Converse pelo site</h2></div></div>
      <div className={styles.recipient}><label htmlFor="chat-recipient">Falar com</label><select id="chat-recipient" value={recipient} onChange={(event) => { setRecipient(event.target.value); setMessages([]); setError(""); setLoading(true); }}><option value="smartfix">Equipe SmartFix</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>Assistência: {partner.name}</option>)}</select>{partners.length === 0 && <small>Assistências aparecem aqui quando estiverem vinculadas a um reparo seu.</small>}</div>
      <p className={styles.notice}>Atendimento de segunda a sexta, das 8h às 18h (horário de Brasília). Suas mensagens ficam registradas; o prazo de resposta ainda será definido.</p>
      <div className={styles.messages} aria-live="polite">{loading ? <p className={styles.empty}>Carregando conversa…</p> : messages.length === 0 ? <div className={styles.chatEmpty}><span>💬</span><h3>Inicie uma conversa</h3><p>Descreva sua dúvida. A resposta de um atendente aparecerá aqui.</p></div> : messages.map((message) => <div key={message.id} className={message.senderRole === "client" ? styles.sent : styles.received}>{message.senderRole !== "client" && <strong>{message.senderRole === "admin" ? "Equipe SmartFix" : "Assistência"}</strong>}<p>{message.body}</p><time dateTime={message.createdAt}>{time(message.createdAt)}</time></div>)}<div ref={bottomRef} /></div>
      {error && <div className={styles.error} role="alert">{error} <button type="button" onClick={() => void refresh(true)}>Tentar novamente</button></div>}
      <form className={styles.composer} onSubmit={send}><label htmlFor="support-message" className={styles.srOnly}>Mensagem para o atendimento</label><textarea id="support-message" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000} rows={2} placeholder="Escreva sua mensagem…" disabled={sending || loading || Boolean(error)} /><button type="submit" disabled={!draft.trim() || sending || loading || Boolean(error)}>{sending ? "Enviando…" : "Enviar"}</button></form>
    </section></div>
  </div></main>;
}
