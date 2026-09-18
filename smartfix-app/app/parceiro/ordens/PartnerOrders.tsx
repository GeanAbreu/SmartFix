"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import { ORDER_LABELS, type OrderStatus, type RepairOrder } from "@/src/types/workflow";
import styles from "./orders.module.css";

type Order = RepairOrder & { totalCents: number };
type Filter = "all" | "attention" | "active" | "finished";

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
  if (filter === "finished") return order.status === "completed" || order.status === "cancelled";
  return true;
}

function QuoteForm({ orderId, busy, onSubmit }: { orderId: string; busy: boolean; onSubmit: (body: unknown) => Promise<void> }) {
  const [count, setCount] = useState(1);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const items = Array.from({ length: count }, (_, index) => ({
      name: String(data.get(`name-${index}`) || "").trim(),
      quantity: Number(data.get(`quantity-${index}`)),
      unitPriceCents: Math.round(Number(data.get(`price-${index}`)) * 100),
    }));
    void onSubmit({ action: "quote", diagnosis: String(data.get("diagnosis") || "").trim(), items });
  }

  return <form key={orderId} className={styles.quoteForm} onSubmit={submit}>
    <h3>{"Preparar orçamento"}</h3>
    <p>Informe o diagnóstico e os serviços ou peças necessários.</p>
    <label>Diagnóstico<textarea name="diagnosis" minLength={3} maxLength={3000} required placeholder="Descreva o problema identificado" /></label>
    {Array.from({ length: count }, (_, index) => <div className={styles.quoteRow} key={index}>
      <label>Serviço ou peça<input name={`name-${index}`} maxLength={150} required placeholder="Ex.: Troca de tela" /></label>
      <label>Quantidade<input name={`quantity-${index}`} type="number" min={1} max={100} defaultValue={1} required /></label>
      <label>Preço unitário (R$)<input name={`price-${index}`} type="number" min={0} max={100000} step="0.01" required placeholder="0,00" /></label>
    </div>)}
    <div className={styles.formActions}><button type="button" className={styles.secondaryButton} disabled={busy || count >= 30} onClick={() => setCount((current) => current + 1)}>+ Adicionar item</button><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? "Enviando..." : "Enviar orçamento ao cliente"}</button></div>
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
  const [selectedId, setSelectedId] = useState(initialOrderId);

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

  return <main className={styles.page}>
    <div className={styles.inner}>
      <header className={styles.header}><div><span className={styles.eyebrow}>ÁREA DO PARCEIRO</span><h1>Ordens de serviço</h1><p>Acompanhe solicitações, envie orçamentos e atualize cada reparo.</p></div><button type="button" className={styles.refreshButton} onClick={() => void refresh(true)} disabled={refreshing}>{refreshing ? "Atualizando..." : "↻ Atualizar"}</button></header>
      <div className={styles.filters} role="group" aria-label="Filtrar ordens">
        {([ ["all", "Todas"], ["attention", "Precisam de atenção"], ["active", "Em andamento"], ["finished", "Finalizadas"] ] as const).map(([value, label]) => <button key={value} type="button" className={filter === value ? styles.filterActive : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}<span>{loading ? "—" : counts[value]}</span></button>)}
      </div>
      {error && <div className={styles.error} role="alert">{error} <button type="button" onClick={() => void refresh(true)}>Tentar novamente</button></div>}
      {message && <p className={styles.message} role="status">{message}</p>}
      <div className={styles.workspace}>
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
                <section><h3>Problema informado</h3><p>{selected.problem}</p>{selected.symptoms.length > 0 && <div className={styles.tags}>{selected.symptoms.map((symptom) => <span key={symptom}>{symptom}</span>)}</div>}</section>
                {selected.checklist.length > 0 && <section><h3>Checklist do aparelho</h3><ul className={styles.simpleList}>{selected.checklist.map((item) => <li key={item}>{item}</li>)}</ul></section>}
                {selected.diagnosis && <section><h3>Diagnóstico</h3><p>{selected.diagnosis}</p></section>}
                {selected.quote.length > 0 && <section><h3>Orçamento</h3><div className={styles.quoteItems}>{selected.quote.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name}<small>{item.quantity} × {money(item.unitPriceCents)}</small></span><strong>{money(item.quantity * item.unitPriceCents)}</strong></div>)}</div><div className={styles.quoteTotal}><span>Total</span><strong>{money(selected.totalCents)}</strong></div></section>}
                {selected.status === "quoted" && <p className={styles.waitingNote}>Orçamento enviado. Aguardando a aprovação do cliente.</p>}
                {(selected.status === "pending" || selected.status === "quoted") && <QuoteForm key={selected.id} orderId={selected.id} busy={busy} onSubmit={(body) => act(selected.id, body)} />}
                {!!nextStatuses[selected.status]?.length && <section><h3>Próxima etapa</h3><div className={styles.statusActions}>{nextStatuses[selected.status]?.map((status) => <button key={status} type="button" className={styles.primaryButton} disabled={busy} onClick={() => void act(selected.id, { action: "status", status })}>{busy ? "Atualizando..." : `Marcar como ${ORDER_LABELS[status].toLocaleLowerCase("pt-BR")}`}</button>)}</div></section>}
                <section><h3>Histórico</h3><ol className={styles.history}>{selected.history.map((item, index) => <li key={`${item.at}-${index}`}><span>{ORDER_LABELS[item.status]}</span><time dateTime={item.at}>{new Date(item.at).toLocaleString("pt-BR")}</time></li>)}</ol></section>
              </div></>}
        </section>
      </div>
    </div>
  </main>;
}
