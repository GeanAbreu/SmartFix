"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./help.module.css";

const faqs = [
  { question: "Como solicito um reparo?", answer: "Acesse Solicitar reparo, escolha o aparelho e a assistência, descreva o defeito e informe sintomas e acessórios. Fotos nítidas e uma descrição completa ajudam a assistência a preparar o diagnóstico." },
  { question: "O que acontece depois da solicitação?", answer: "A assistência analisa o pedido e prepara o diagnóstico e o orçamento. Você recebe as atualizações em Meus reparos e nas notificações. Nenhum reparo começa sem sua aprovação e a confirmação do pagamento." },
  { question: "Como avalio um orçamento?", answer: "Confira cada peça e serviço, quantidades, valores, desconto, prazo estimado e garantia. Se algo não estiver claro, fale com a assistência antes de aprovar. Uma alteração no orçamento exige uma nova confirmação." },
  { question: "Como faço o pagamento?", answer: "Depois de aprovar o orçamento, use o botão de pagamento na O.S. Você será direcionado ao checkout seguro InfinitePay da SmartFix. O reparo só começa após a confirmação." },
  { question: "Por que o botão de pagamento está indisponível?", answer: "A O.S. precisa ter um orçamento válido e não expirado. Fale com a assistência pelo chat; nunca envie dados de cartão fora do checkout." },
  { question: "Como acompanho o reparo?", answer: "Em Meus reparos, consulte o status, o histórico, o orçamento e o pagamento. Os status informam se a assistência está diagnosticando, reparando, aguardando peças ou se o aparelho está pronto." },
  { question: "Como entrego o aparelho para reparo?", answer: "Após a confirmação do pagamento, combine diretamente com a assistência e leve o aparelho ao endereço informado na O.S." },
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

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const filteredFaqs = useMemo(() => faqs.filter(({ question, answer }) => `${question} ${answer}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))), [search]);

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.intro}><p className={styles.eyebrow}>CENTRAL DE AJUDA</p><h1>Como podemos ajudar?</h1><p>Encontre orientações e respostas para acompanhar seu reparo com segurança.</p></header>
    <section className={styles.journey} aria-label="Etapas do reparo">{journey.map(([step, title, text]) => <article key={step}><span>{step}</span><div><h2>{title}</h2><p>{text}</p></div></article>)}</section>
    <div className={styles.layout}><div className={styles.leftColumn}>
      <section className={styles.panel} aria-labelledby="faq-title"><div className={styles.heading}><span className={styles.icon}>?</span><div><p className={styles.eyebrow}>RESPOSTAS RÁPIDAS</p><h2 id="faq-title">Perguntas frequentes</h2></div></div>
        <label className={styles.search}><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Busque por uma dúvida" aria-label="Buscar perguntas frequentes" /></label>
        <div className={styles.faqs}>{filteredFaqs.length === 0 ? <p className={styles.empty}>Nenhuma pergunta encontrada.</p> : filteredFaqs.map(({ question, answer }) => <div key={question} className={styles.faq}><button type="button" aria-expanded={openFaq === question} onClick={() => setOpenFaq(openFaq === question ? null : question)}><span>{question}</span><b aria-hidden="true">{openFaq === question ? "−" : "+"}</b></button>{openFaq === question && <p>{answer}</p>}</div>)}</div>
      </section>
      <section className={styles.panel} aria-labelledby="contact-title"><div className={styles.heading}><span className={styles.icon}>☎</span><div><p className={styles.eyebrow}>OUTROS CANAIS</p><h2 id="contact-title">Contato</h2></div></div><p className={styles.description}>Fale com a equipe SmartFix em dias úteis, das 08h às 18h (horário de Brasília). Para agilizar, informe o número da O.S. e descreva o que já tentou.</p><dl className={styles.contacts}><div><dt>E-mail</dt><dd><a href="mailto:contato@smartfix.com.br">contato@smartfix.com.br</a></dd></div><div><dt>Atendimento pelo site</dt><dd><Link href="/#contato">Enviar mensagem</Link></dd></div></dl><p className={styles.safety}>Nunca envie senha, código de verificação ou dados completos do cartão.</p></section>
    </div></div>
  </div></main>;
}
