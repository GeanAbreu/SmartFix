"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import { ORDER_LABELS, type OrderStatus, type RepairOrder } from "@/src/types/workflow";
import ConfirmDialog from "@/app/cliente/components/ConfirmDialog";
import styles from "./orders.module.css";

type Order = RepairOrder & { totalCents: number };
type Filter = "all" | "attention" | "active" | "finished";
type View = "list" | "board";

const nextStatuses: Partial<Record<OrderStatus, OrderStatus[]>> = {
  approved: ["in_progress"],
  in_progress: ["waiting_parts", "ready"],
  waiting_parts: ["in_progress"],
  ready: ["completed"],
};

const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const shortId = (id: string) => id.slice(0, 8).toUpperCase();

async function request<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body === undefined
    ? { credentials: "include", cache: "no-store" }
    : { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await readApiResponse<T>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível concluir a operação.");
  return result.data;
}

function matchesFilter(order: Order, filter: Filter) {
  if (filter === "attention") return order.status === "pending" || order.status === "quoted";
  if (filter === "active") return ["approved", "in_progress", "waiting_parts", "ready"].includes(order.status);
  if (filter === "finished") return ["completed", "cancelled", "rejected"].includes(order.status);
  return true;
}

function QuoteForm({ orderId, busy, onSubmit }: { orderId: string; busy: boolean; onSubmit: (body: unknown) => Promise<void> }) {
  const [itemIds, setItemIds] = useState([0]);
  const [previewTotal, setPreviewTotal] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  function updatePreview(form: HTMLFormElement) {
    const data = new FormData(form);
    const items = itemIds.reduce((total, id) => total + Number(data.get(`quantity-${id}`) || 0) * Number(data.get(`price-${id}`) || 0), 0);
    setPreviewTotal(Math.round((items + Number(data.get("deliveryFee") || 0)) * 100));
    try {
      localStorage.setItem(`smartfix-quote-draft:${orderId}`, JSON.stringify({
        diagnosis: String(data.get("diagnosis") || ""), estimatedDays: String(data.get("estimatedDays") || ""), warrantyDays: String(data.get("warrantyDays") || ""), deliveryFee: String(data.get("deliveryFee") || ""), savedAt: new Date().toISOString(),
      }));
    } catch { /* Draft storage is optional. */ }
  }

  function diagnosisTemplate(value: string) {
    const field = formRef.current?.elements.namedItem("diagnosis");
    if (field instanceof HTMLTextAreaElement) { field.value = value; field.focus(); updatePreview(formRef.current!); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const items = itemIds.map((id) => ({
      name: String(data.get(`name-${id}`) || "").trim(),
      category: String(data.get(`category-${id}`)),
      details: String(data.get(`details-${id}`) || "").trim(),
      quantity: Number(data.get(`quantity-${id}`)),
      unitPriceCents: Math.round(Number(data.get(`price-${id}`)) * 100),
    }));
    void onSubmit({ action: "quote", diagnosis: String(data.get("diagnosis") || "").trim(),
      estimatedDays: Number(data.get("estimatedDays")), warrantyDays: Number(data.get("warrantyDays")),
      deliveryFeeCents: Math.round(Number(data.get("deliveryFee")) * 100), items });
  }

  return <form key={orderId} ref={formRef} className={styles.quoteForm} onSubmit={submit} onInput={(event) => updatePreview(event.currentTarget)}>
    <h3>{"Preparar orçamento"}</h3>
    <p>Informe o diagnóstico e os serviços ou peças necessários.</p>
    <div className={styles.templates}><span>Atalhos de diagnóstico</span><button type="button" onClick={() => diagnosisTemplate("Falha confirmada após testes funcionais. Recomenda-se a substituição do componente afetado e novos testes após o reparo.")}>Falha de componente</button><button type="button" onClick={() => diagnosisTemplate("Foram identificados sinais de oxidação. É necessária limpeza técnica e avaliação dos componentes afetados antes da confirmação do reparo.")}>Oxidação</button><button type="button" onClick={() => diagnosisTemplate("Defeito não reproduzido nos testes iniciais. O aparelho permanecerá em observação para confirmação da falha relatada.")}>Em observação</button></div>
    <label>Diagnóstico<textarea name="diagnosis" minLength={3} maxLength={3000} required placeholder="Descreva o problema identificado" /></label>
    <div className={styles.quoteRow}>
      <label>Prazo estimado (dias)<input name="estimatedDays" type="number" min={1} max={365} defaultValue={3} required /></label>
      <label>Garantia (dias)<input name="warrantyDays" type="number" min={0} max={3650} defaultValue={90} required /></label>
      <label>Coleta e entrega (R$)<input name="deliveryFee" type="number" min={0} max={100000} step="0.01" defaultValue="0.00" required /></label>
    </div>
    {itemIds.map((id, index) => <div className={styles.quoteItemEditor} key={id}><div className={styles.quoteRow}>
      <label>Serviço ou peça<input name={`name-${id}`} maxLength={150} required placeholder="Ex.: Tela OLED" /><input name={`details-${id}`} maxLength={500} placeholder="Detalhes opcionais" /></label>
      <label>Categoria<select name={`category-${id}`} defaultValue="labor"><option value="labor">Mão de obra</option><option value="part">Peça/material</option></select></label>
      <label>Quantidade<input name={`quantity-${id}`} type="number" min={1} max={100} defaultValue={1} required /></label>
      <label>Preço unitário (R$)<input name={`price-${id}`} type="number" min={0} max={100000} step="0.01" required placeholder="0,00" /></label>
    </div><button type="button" className={styles.removeItemButton} disabled={busy || itemIds.length === 1} onClick={() => setItemIds((current) => current.filter((itemId) => itemId !== id))} aria-label={`Remover item ${index + 1}`}>Remover item</button>
    </div>)}
    <div className={styles.quotePreview}><span>Total estimado</span><strong>{money(previewTotal)}</strong><small>Atualizado enquanto você preenche os itens</small></div>
    <div className={styles.formActions}><button type="button" className={styles.secondaryButton} disabled={busy || itemIds.length >= 30} onClick={() => setItemIds((current) => [...current, Math.max(...current) + 1])}>+ Adicionar item</button><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Enviando..." : "Revisar e enviar orçamento"}</button></div>
  </form>;
}

function OperationsForm({ order, busy, onSubmit }: { order: Order; busy: boolean; onSubmit: (body: unknown) => Promise<void> }) {
  return <form className={styles.operationsForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void onSubmit({ action: "operations", technicianName: data.get("technicianName"), promisedDate: data.get("promisedDate"), internalNotes: data.get("internalNotes") }); }}>
    <div><h3>Gestão interna</h3><p>Organize a execução. As observações internas não aparecem para o cliente.</p></div>
    <div className={styles.operationsGrid}><label>Técnico responsável<input name="technicianName" maxLength={120} defaultValue={order.serviceDetails.technicianName || ""} placeholder="Nome do profissional" /></label><label>Prazo prometido<input name="promisedDate" type="date" defaultValue={order.serviceDetails.promisedDate || ""} /></label></div>
    <label>Observações internas<textarea name="internalNotes" maxLength={5000} defaultValue={order.serviceDetails.internalNotes || ""} placeholder="Peças, testes, pendências e informações da bancada." /></label>
    <button type="submit" className={styles.secondaryButton} disabled={busy}>{busy ? "Salvando..." : "Salvar dados operacionais"}</button>
  </form>;
}

function RejectForm({ busy, onSubmit }: { busy: boolean; onSubmit: (body: unknown) => Promise<void> }) {
  return <form className={styles.operationsForm} onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); void onSubmit({ action: "reject", reason: data.get("reason") }); }}>
    <div><h3>Recusar solicitação</h3><p>Use somente quando a assistência não puder atender e explique o motivo ao cliente.</p></div>
    <label>Motivo da recusa<textarea name="reason" minLength={10} maxLength={1000} required placeholder="Ex.: modelo fora da cobertura da assistência." /></label>
    <button type="submit" className={styles.secondaryButton} disabled={busy}>{busy ? "Recusando..." : "Recusar solicitação"}</button>
  </form>;
}

export default function PartnerOrders({ initialOrderId }: { initialOrderId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState(initialOrderId);
  const [pendingComplete, setPendingComplete] = useState<Order | null>(null);

  const refresh = useCallback(async (showProgress = false) => {
    if (showProgress) setRefreshing(true);
    try {
      const data = await request<{ orders: Order[] }>("/api/orders");
      setOrders(data.orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar as ordens.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  async function act(id: string, body: unknown) {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/orders/${encodeURIComponent(id)}`, body);
      await refresh();
      setMessage("Ordem atualizada com sucesso.");
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Não foi possível atualizar a ordem.");
    } finally {
      setBusy(false);
    }
  }

  const counts = {
    all: orders.length,
    attention: orders.filter((order) => matchesFilter(order, "attention")).length,
    active: orders.filter((order) => matchesFilter(order, "active")).length,
    finished: orders.filter((order) => matchesFilter(order, "finished")).length,
  };
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visible = orders.filter((order) => matchesFilter(order, filter) &&
    `${order.device} ${order.id} ${order.problem} ${ORDER_LABELS[order.status]}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
  const selected = visible.find((order) => order.id === selectedId) || visible[0];
  const boardColumns = [
    { title: "Novas", statuses: ["pending"] },
    { title: "Aguardando cliente", statuses: ["quoted"] },
    { title: "Em execução", statuses: ["approved", "in_progress"] },
    { title: "Aguardando peça", statuses: ["waiting_parts"] },
    { title: "Prontas", statuses: ["ready"] },
  ] as const;

  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.header}><div><span className={styles.eyebrow}>ÁREA DO PARCEIRO</span><h1>Ordens de serviço</h1><p>Acompanhe solicitações, envie orçamentos e atualize cada reparo.</p></div><button type="button" className={styles.refreshButton} onClick={() => void refresh(true)} disabled={refreshing}>{refreshing ? "Atualizando..." : "↻ Atualizar"}</button></header>
      <div className={styles.toolbar}><div className={styles.filters} role="group" aria-label="Filtrar ordens">
        {([ ["all", "Todas"], ["attention", "Precisam de atenção"], ["active", "Em andamento"], ["finished", "Finalizadas"] ] as const).map(([value, label]) => <button key={value} type="button" className={filter === value ? styles.filterActive : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{loading ? "—" : counts[value]}</span></button>)}
      </div><div className={styles.viewToggle}><button type="button" className={view === "list" ? styles.filterActive : ""} onClick={() => setView("list")}>☷ Lista</button><button type="button" className={view === "board" ? styles.filterActive : ""} onClick={() => setView("board")}>▦ Kanban</button></div></div>
      {error && <div className={styles.error} role="alert">{error} <button type="button" onClick={() => void refresh(true)}>Tentar novamente</button></div>}
      {message && <p className={styles.message} role="status">{message}</p>}
      {view === "board" && <section className={styles.board} aria-label="Kanban de ordens">{boardColumns.map((column) => { const items = visible.filter((order) => (column.statuses as readonly OrderStatus[]).includes(order.status)); return <div className={styles.boardColumn} key={column.title}><header><strong>{column.title}</strong><span>{items.length}</span></header><div>{items.length === 0 ? <p>Nenhuma ordem</p> : items.map((order) => { const next = nextStatuses[order.status]?.[0]; return <article key={order.id}><button type="button" onClick={() => { setSelectedId(order.id); setView("list"); }}><small>O.S. {shortId(order.id)}</small><strong>{order.device}</strong><span>{order.problem}</span>{order.serviceDetails.promisedDate && <time>Prazo: {order.serviceDetails.promisedDate.split("-").reverse().join("/")}</time>}{order.serviceDetails.technicianName && <em>{order.serviceDetails.technicianName}</em>}</button>{next && <button type="button" className={styles.boardAdvance} disabled={busy} onClick={() => next === "completed" ? setPendingComplete(order) : void act(order.id, { action: "status", status: next })}>Avançar para {ORDER_LABELS[next].toLocaleLowerCase("pt-BR")} →</button>}</article>; })}</div></div>; })}</section>}
      {view === "list" && <div className={styles.workspace}>
        <section className={styles.orderList} aria-label="Lista de ordens">
          <label className={styles.searchLabel}>Buscar ordem<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Aparelho, número ou status" /></label>
          {loading ? <p className={styles.listState} role="status">Carregando ordens...</p>
            : visible.length === 0 ? <p className={styles.listState}>{orders.length === 0 ? "Nenhuma ordem recebida ainda." : "Nenhuma ordem encontrada para este filtro."}</p>
            : <ul>{visible.map((order) => <li key={order.id}><button type="button" className={`${styles.orderButton} ${selected?.id === order.id ? styles.orderSelected : ""}`} aria-pressed={selected?.id === order.id} onClick={() => { setSelectedId(order.id); setMessage(""); }}><span className={styles.orderTop}><strong>{order.device}</strong><span className={`${styles.status} ${styles[order.status]}`}>{ORDER_LABELS[order.status]}</span></span><span className={styles.orderProblem}>{order.problem}</span><span className={styles.orderMeta}>O.S. {shortId(order.id)} · {new Date(order.createdAt).toLocaleDateString("pt-BR")}</span></button></li>)}</ul>}
        </section>
        <section className={styles.details} aria-label="Detalhes da ordem">
          {!selected ? <div className={styles.emptyDetail}><span aria-hidden="true">▣</span><h2>Selecione uma ordem</h2><p>Os detalhes e as próximas ações aparecerão aqui.</p></div>
            : <><div className={styles.detailHeader}><div><span className={styles.eyebrow}>O.S. {shortId(selected.id)}</span><h2>{selected.device}</h2><p>Recebida em {new Date(selected.createdAt).toLocaleDateString("pt-BR")}</p></div><span className={`${styles.status} ${styles[selected.status]}`}>{ORDER_LABELS[selected.status]}</span></div>
              <div className={styles.detailBody}>
                <section className={styles.clientInfo}><h3>Cliente e atendimento</h3><div><span><small>Cliente</small><strong>{selected.clientName || "Cliente"}</strong></span><span><small>Telefone</small><strong>{selected.clientPhone || "Não informado"}</strong></span><span><small>E-mail</small><strong>{selected.clientEmail || "Não informado"}</strong></span><span><small>Coleta / atendimento</small><strong>{selected.serviceDetails.scheduledDate ? `${selected.serviceDetails.scheduledDate.split("-").reverse().join("/")} · ${selected.serviceDetails.schedulePeriod === "morning" ? "Manhã" : "Tarde"}` : "Ainda não agendado"}</strong></span><span className={styles.wideInfo}><small>Endereço</small><strong>{selected.serviceDetails.serviceAddress || "Definido após aprovação do orçamento"}</strong></span><span><small>Pagamento</small><strong>{selected.serviceDetails.paymentStatus === "confirmed" ? "Confirmado" : "Pendente"}</strong></span></div></section>
                <section><h3>Problema informado</h3><p>{selected.problem}</p>{selected.symptoms.length > 0 && <div className={styles.tags}>{selected.symptoms.map((symptom) => <span key={symptom}>{symptom}</span>)}</div>}</section>
                {selected.checklist.length > 0 && <section><h3>Checklist do aparelho</h3><ul className={styles.simpleList}>{selected.checklist.map((item) => <li key={item}>{item}</li>)}</ul></section>}
                {selected.diagnosis && <section><h3>Diagnóstico</h3><p>{selected.diagnosis}</p></section>}
                {selected.quote.length > 0 && <section><h3>Orçamento</h3><div className={styles.quoteItems}>{selected.quote.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name}<small>{item.quantity} × {money(item.unitPriceCents)}</small></span><strong>{money(item.quantity * item.unitPriceCents)}</strong></div>)}</div><div className={styles.quoteTotal}><span>Total</span><strong>{money(selected.totalCents)}</strong></div></section>}
                {selected.status === "quoted" && <p className={styles.waitingNote}>Orçamento enviado. Aguardando a aprovação do cliente.</p>}
                {(selected.status === "pending" || selected.status === "quoted") && !selected.serviceDetails.paymentPreferenceId && <QuoteForm key={selected.id} orderId={selected.id} busy={busy} onSubmit={(body) => act(selected.id, body)} />}
                {selected.status === "quoted" && selected.serviceDetails.paymentPreferenceId && <p className={styles.waitingNote}>O cliente iniciou o checkout. O orçamento está bloqueado para evitar divergência de valores.</p>}
                {!!nextStatuses[selected.status]?.length && <section><h3>Próxima etapa</h3><div className={styles.statusActions}>{nextStatuses[selected.status]?.map((status) => <button key={status} type="button" className={styles.primaryButton} disabled={busy} onClick={() => status === "completed" ? setPendingComplete(selected) : void act(selected.id, { action: "status", status })}>{busy ? "Atualizando..." : `Marcar como ${ORDER_LABELS[status].toLocaleLowerCase("pt-BR")}`}</button>)}</div></section>}
                {selected.status === "pending" && <RejectForm busy={busy} onSubmit={(body) => act(selected.id, body)} />}
                {!(["completed", "cancelled", "rejected"] as OrderStatus[]).includes(selected.status) && <OperationsForm key={`operations-${selected.id}-${selected.serviceDetails.technicianName}-${selected.serviceDetails.promisedDate}`} order={selected} busy={busy} onSubmit={(body) => act(selected.id, body)} />}
                <section><h3>Histórico</h3><ol className={styles.history}>{selected.history.map((item, index) => <li key={`${item.at}-${index}`}><span>{ORDER_LABELS[item.status]}</span><time dateTime={item.at}>{new Date(item.at).toLocaleString("pt-BR")}</time></li>)}</ol></section>
              </div></>}
        </section>
      </div>}
      <ConfirmDialog open={pendingComplete !== null} title="Concluir ordem de serviço?" message={`A O.S. de ${pendingComplete?.device || "este dispositivo"} será encerrada e o cliente poderá avaliá-la.`} confirmLabel="Concluir ordem" busyLabel="Concluindo..." busy={busy} onCancel={() => { if (!busy) setPendingComplete(null); }} onConfirm={() => { if (pendingComplete) void act(pendingComplete.id, { action: "status", status: "completed" }).then(() => setPendingComplete(null)); }} />
    </div>
  </main>;
}
