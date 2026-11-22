"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./help.module.css";

const topics = [
  { title: "Primeiros passos", text: "Complete os dados da assistência, cadastre o endereço principal e publique os serviços oferecidos. Essas informações ajudam o cliente a comparar opções e são necessárias para a logística.", href: "/parceiro/perfil", action: "Revisar minha assistência" },
  { title: "Ordens de serviço", text: "Analise a solicitação, registre um diagnóstico claro e envie um orçamento detalhado. O serviço só deve começar depois da aprovação e da confirmação do pagamento.", href: "/parceiro/ordens", action: "Ver ordens" },
  { title: "Pagamentos e repasses", text: "Conecte sua conta Mercado Pago no Financeiro. A cada pagamento, 90% é destinado à assistência e 10% fica com a SmartFix. O painel mostra valor bruto, taxa e repasse líquido.", href: "/parceiro/financeiro", action: "Configurar recebimentos" },
  { title: "Coleta e devolução", text: "Após o pagamento confirmado, solicite a coleta na O.S. Acompanhe o rastreio e, quando o reparo estiver pronto, organize a devolução ao cliente.", href: "/parceiro/ordens", action: "Acompanhar logística" },
] as const;

const faqs = [
  ["Por que o cliente não consegue pagar?", "Confira em Financeiro se a conta Mercado Pago aparece como conectada. O orçamento também precisa ter sido enviado, aceito pelo cliente e permanecer sem alterações. Se você editar os valores, um novo checkout será gerado."],
  ["Como funciona a taxa da SmartFix?", "A taxa da plataforma é de 10% sobre o total cobrado na O.S. O Mercado Pago faz a divisão no checkout: 90% corresponde ao repasse da assistência. O detalhamento fica disponível em Financeiro."],
  ["Quando posso iniciar o reparo?", "Somente quando a O.S. indicar orçamento aprovado e pagamento confirmado. Antes disso, não compre peças nem execute o serviço, pois o cliente ainda pode recusar o orçamento."],
  ["Como montar um bom orçamento?", "Separe peças e mão de obra, informe quantidade, valor unitário, prazo estimado e garantia. Explique o diagnóstico em linguagem simples e evite itens genéricos sem descrição."],
  ["Como altero o status da O.S.?", "Use a própria O.S. e avance conforme o trabalho real: em reparo, aguardando peças, pronto e concluído. Atualizações precisas reduzem dúvidas e notificam o cliente."],
  ["O que fazer em caso de garantia?", "Leia o motivo enviado pelo cliente, confira o prazo da garantia e responda pela O.S. Registre a decisão e a justificativa. Não combine uma solução fora da plataforma sem manter o histórico atualizado."],
  ["Como funciona coleta e devolução?", "A coleta fica disponível após o pagamento confirmado. Cliente e assistência precisam ter endereço e telefone válidos. A devolução pode ser solicitada quando a O.S. estiver pronta."],
  ["O que fazer se a entrega falhar?", "Não crie várias entregas seguidas. Consulte o status e o rastreio na O.S. Se houver aviso de verificação manual, fale com o suporte informando o número da O.S. e o ID da entrega, quando disponível."],
  ["Como falar com o cliente?", "Use Mensagens para manter orientações, dúvidas e combinações registradas. Nunca peça senha, código de pagamento ou dados completos de cartão."],
  ["Como proteger minha conta?", "Use uma senha exclusiva, encerre a sessão em computadores compartilhados e conecte apenas a conta Mercado Pago oficial da assistência. A SmartFix nunca pede sua senha do Mercado Pago."],
] as const;

export default function PartnerHelp() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(() => faqs.filter(([question, answer]) => `${question} ${answer}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))), [search]);
  return <main className={styles.page}><div className={styles.container}>
    <header><span>CENTRAL DO PARCEIRO</span><h1>Ajuda para sua assistência</h1><p>Orientações práticas para operar as O.S., receber pagamentos e oferecer uma experiência segura ao cliente.</p></header>
    <section className={styles.quick} aria-label="Guias do parceiro">{topics.map((topic) => <article key={topic.title}><h2>{topic.title}</h2><p>{topic.text}</p><Link href={topic.href}>{topic.action} →</Link></article>)}</section>
    <div className={styles.columns}><section className={styles.panel}><div className={styles.panelTitle}><span>?</span><div><small>RESPOSTAS RÁPIDAS</small><h2>Perguntas frequentes</h2></div></div><label className={styles.search}>Buscar uma dúvida<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ex.: repasse, orçamento ou entrega" /></label><div className={styles.faqs}>{filtered.length ? filtered.map(([question, answer]) => <div className={styles.faq} key={question}><button type="button" aria-expanded={open === question} onClick={() => setOpen(open === question ? null : question)}><span>{question}</span><b>{open === question ? "−" : "+"}</b></button>{open === question && <p>{answer}</p>}</div>) : <p className={styles.empty}>Nenhuma orientação encontrada. Tente outras palavras.</p>}</div></section>
      <aside className={styles.side}><section className={styles.panel}><h2>Antes de enviar um orçamento</h2><ol><li>Confirme aparelho, defeito e acessórios.</li><li>Registre o diagnóstico de forma objetiva.</li><li>Separe peças e mão de obra.</li><li>Informe prazo e garantia realistas.</li><li>Revise valores antes de enviar.</li></ol></section><section className={styles.panel}><h2>Precisa de atendimento?</h2><p>Envie o número da O.S., uma descrição do ocorrido e, se possível, uma captura de tela. Nunca envie senhas ou dados de cartão.</p><a className={styles.contact} href="mailto:contato@smartfix.com.br?subject=Suporte%20ao%20parceiro%20SmartFix">contato@smartfix.com.br</a><small>Atendimento em dias úteis, das 08h às 18h (horário de Brasília).</small></section></aside>
    </div>
  </div></main>;
}
