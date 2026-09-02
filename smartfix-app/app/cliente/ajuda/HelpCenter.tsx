"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState } from "react";
import styles from "./help.module.css";

const faqs = [
  ["Como acompanhar meu reparo?", "Acompanhe o andamento em Meus Reparos. O status será atualizado conforme a assistência avançar no serviço."],
  ["Problemas com coleta ou entrega", "Confira o status da coleta ou entrega e use este canal para falar com a assistência responsável."],
  ["Informações sobre orçamento", "Quando a avaliação terminar, o orçamento ficará disponível para consulta e aprovação."],
  ["Garantia dos serviços", "A garantia varia conforme o serviço. Consulte os detalhes do reparo ou confirme diretamente com a assistência."],
  ["Cancelamento de serviço", "A possibilidade de cancelamento depende da etapa do reparo e deve ser confirmada com a assistência."],
] as const;

type Message = { id: number; author: "client" | "support"; text: string; time: string };

const initialMessages: Message[] = [
  { id: 1, author: "support", text: "Olá! Como podemos ajudar você hoje?", time: "10:30" },
  { id: 2, author: "client", text: "Gostaria de saber o status do meu reparo.", time: "10:31" },
  { id: 3, author: "support", text: "Informe o número do protocolo para consultarmos.", time: "10:31" },
];

function currentTime() {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const chatRef = useRef<HTMLElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredFaqs = useMemo(() => faqs.filter(([question]) =>
    question.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))
  ), [search]);

  function addMessage(text: string, author: Message["author"]) {
    setMessages((current) => [...current, { id: Date.now() + current.length, author, text, time: currentTime() }]);
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addMessage(text, "client");
    setDraft("");
    window.setTimeout(() => addMessage("Recebemos sua mensagem. Um atendente responderá em breve. 😊", "support"), 700);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/cliente/dashboard" className={styles.brand}>🔧 <strong>SMART<span>FIX</span></strong></Link>
        <nav aria-label="Navegação do cliente"><Link href="/cliente/dashboard">Início</Link><span>Central de Ajuda</span><Link href="/cliente/enderecos">Endereços</Link></nav>
      </header>

      <section className={styles.intro}>
        <div><p>Suporte SmartFix</p><h1>Central de Ajuda e Chat</h1><span>Encontre respostas rápidas ou fale com a assistência designada.</span></div>
        <aside><b>👥</b><div><small>Assistência designada</small><strong>TechFix Soluções</strong><span>● Atendimento disponível</span></div></aside>
      </section>

      <section className={styles.layout}>
        <article className={styles.panel}>
          <div className={styles.title}><span>?</span><h2>Central de Ajuda</h2></div>
          <label className={styles.search}>🔎<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar dúvidas..." /></label>
          <h3>Perguntas frequentes</h3>
          <div className={styles.faqs}>{filteredFaqs.length === 0 ? <p className={styles.noResult}>Nenhuma pergunta encontrada.</p> : filteredFaqs.map(([question, answer]) => {
            const index = faqs.findIndex(([candidate]) => candidate === question);
            const expanded = openFaq === index;
            return <div key={question} className={styles.faq}>
              <button type="button" aria-expanded={expanded} onClick={() => setOpenFaq(expanded ? null : index)}><span>{question}</span><b>{expanded ? "−" : "+"}</b></button>
              {expanded && <p>{answer}</p>}
            </div>;
          })}</div>
          <div className={styles.contact}><span>🎧</span><div><strong>Não encontrou o que precisa?</strong><p>Fale com a assistência pelo chat ao lado.</p></div><button type="button" onClick={() => chatRef.current?.scrollIntoView({ behavior: "smooth" })}>Abrir chat</button></div>
        </article>

        <section ref={chatRef} className={`${styles.panel} ${styles.chat}`}>
          <div className={styles.chatHeader}><div><span>💬</span><h2>Chat com a Assistência</h2></div><small>● Online</small></div>
          <p className={styles.demo}>Demonstração local — integração em tempo real será adicionada em uma etapa futura.</p>
          <div className={styles.messages}><div className={styles.day}>Hoje</div>{messages.map((message) => (
            <div key={message.id} className={message.author === "client" ? styles.sent : styles.received}>
              {message.author === "support" && <strong>TechFix Soluções</strong>}<p>{message.text}</p><time>{message.time}{message.author === "client" ? " ✓✓" : ""}</time>
            </div>
          ))}</div>
          <form className={styles.composer} onSubmit={send}>
            <button type="button" aria-label="Anexar arquivo" onClick={() => fileRef.current?.click()}>📎</button>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Digite sua mensagem..." aria-label="Mensagem" />
            <button type="submit" aria-label="Enviar mensagem">➤</button>
            <input ref={fileRef} type="file" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) addMessage(`📎 Arquivo selecionado: ${file.name}`, "client"); event.target.value = ""; }} />
          </form>
        </section>
      </section>
    </main>
  );
}
