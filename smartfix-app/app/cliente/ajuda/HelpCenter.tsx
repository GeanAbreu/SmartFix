"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./help.module.css";

const faqs = [
  { question: "Como solicito um reparo?", answer: "Acesse Solicitar reparo, escolha o aparelho e a assistência, descreva o defeito e informe sintomas e acessórios. Fotos nítidas e uma descrição completa ajudam a assistência a preparar o diagnóstico." },
  { question: "O que acontece depois da solicitação?", answer: "A assistência analisa o pedido e prepara o diagnóstico e o orçamento. Você recebe as atualizações em Meus reparos e nas notificações. Nenhum reparo começa sem sua aprovação e a confirmação do pagamento." },
  { question: "Como avalio um orçamento?", answer: "Confira cada peça e serviço, quantidades, valores, desconto, prazo estimado e garantia. Se algo não estiver claro, fale com a assistência antes de aprovar. Uma alteração no orçamento exige uma nova confirmação." },
  { question: "Como faço o pagamento?", answer: "Depois de aprovar o orçamento, use o botão de pagamento na O.S. Você será direcionado ao checkout seguro InfinitePay da SmartFix. O reparo só começa após a confirmação." },
  { question: "Por que o botão de pagamento está indisponível?", answer: "A O.S. precisa ter um orçamento válido e não expirado. Fale com a assistência pelo chat; nunca envie dados de cartão fora do checkout." },
  { question: "Como acompanho o reparo?", answer: "Em Meus reparos, consulte o status, o histórico, o orçamento e o pagamento. Os status informam se a assistência está diagnosticando, reparando, aguardando peças ou se o aparelho está pronto." },
  { question: "Como levo o aparelho à assistência?", answer: "Após a confirmação do pagamento, leve o aparelho diretamente ao endereço da assistência. Se preferir usar um aplicativo de entrega, contrate e acompanhe o serviço por conta própria; a SmartFix não opera transporte integrado." },
  { question: "Posso cancelar a solicitação?", answer: "Você pode cancelar antes de aprovar o orçamento. Depois da aprovação ou do início do serviço, fale com a assistência e com a SmartFix para avaliar peças já compradas e eventual reembolso." },
  { question: "Como funciona o reembolso?", answer: "Quando aplicável, a solicitação é analisada pela SmartFix e processada no mesmo fluxo de pagamento. O prazo para o valor aparecer depende do meio de pagamento e do banco emissor." },
  { question: "Qual é a garantia do serviço?", answer: "O prazo e as condições aparecem no orçamento e na O.S. Se o mesmo problema retornar dentro da garantia, abra a solicitação pela ordem concluída e descreva o que aconteceu." },
  { question: "Como protejo meus dados?", answer: "Pague somente pelo checkout da O.S. A SmartFix e a assistência nunca devem pedir senha, código de verificação ou dados completos do cartão por mensagem. Em caso de suspeita, fale com a equipe SmartFix." },
] as const;

const journey = [
  ["1", "Solicite", "Cadastre o aparelho, explique o problema e escolha uma assistência."],
  ["2", "Revise", "Leia diagnóstico, itens, prazo, garantia e valor antes de aprovar."],
  ["3", "Pague", "Finalize no provedor escolhido e aguarde a confirmação na própria O.S."],
  ["4", "Acompanhe", "Veja o reparo, a conclusão e a garantia em Meus reparos."],
] as const;
type Message = { id: string; senderRole: "client" | "admin" | "partner"; body: string; createdAt: string };
type Partner = { id: string; name: string };
function time(value: string) { return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }

export default function HelpCenter() {
  const searchParams = useSearchParams();
  const requestedPartnerId = searchParams.get("partnerId") || "";
  const requestedOrder = searchParams.get("order") || "";
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [recipient, setRecipient] = useState(requestedPartnerId || "smartfix");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState(requestedOrder ? `Olá! Preciso de ajuda com a O.S. ${requestedOrder.slice(0, 8).toUpperCase()}. ` : "");
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

  // The callback is intentionally keyed only by the selected conversation.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
    <section className={styles.journey} aria-label="Etapas do reparo">{journey.map(([step, title, text]) => <article key={step}><span>{step}</span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
    <div className={styles.layout}><div className={styles.leftColumn}>
      <section className={styles.panel} aria-labelledby="faq-title"><div className={styles.heading}><span className={styles.icon}>?</span><div><p className={styles.eyebrow}>RESPOSTAS RÁPIDAS</p><h2 id="faq-title">Perguntas frequentes</h2></div></div>
        <label className={styles.search}><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busque por uma dúvida" aria-label="Buscar perguntas frequentes" /></label>
        <div className={styles.faqs}>{filteredFaqs.length === 0 ? <p className={styles.empty}>Nenhuma pergunta encontrada.</p> : filteredFaqs.map(({ question, answer }) => <div key={question} className={styles.faq}><button type="button" aria-expanded={openFaq === question} onClick={() => setOpenFaq(openFaq === question ? null : question)}><span>{question}</span><b aria-hidden="true">{openFaq === question ? "−" : "+"}</b></button>{openFaq === question && <p>{answer}</p>}</div>)}</div>
      </section>
      <section className={styles.panel} aria-labelledby="contact-title"><div className={styles.heading}><span className={styles.icon}>☎</span><div><p className={styles.eyebrow}>OUTROS CANAIS</p><h2 id="contact-title">Contato</h2></div></div><p className={styles.description}>Fale com a equipe SmartFix em dias úteis, das 08h às 18h (horário de Brasília). Para agilizar, informe o número da O.S. e descreva o que já tentou.</p><dl className={styles.contacts}><div><dt>E-mail</dt><dd><a href="mailto:contato@smartfix.com.br">contato@smartfix.com.br</a></dd></div><div><dt>Atendimento pelo site</dt><dd><Link href="/#contato">Enviar mensagem</Link></dd></div></dl><p className={styles.safety}>Nunca envie senha, código de verificação ou dados completos do cartão.</p></section>
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
