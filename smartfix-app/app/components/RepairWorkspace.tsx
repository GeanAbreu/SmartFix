"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ORDER_LABELS,
  type OrderStatus,
  type RepairOrder,
} from "@/src/types/workflow";
import styles from "./Workspace.module.css";

export async function api<T>(
  url: string,
  body?: unknown,
  method = "POST",
): Promise<T> {
  const response = await fetch(
    url,
    body === undefined
      ? { cache: "no-store" }
      : {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  const result = await response.json();
  if (!response.ok || !result.success)
    throw new Error(result.message || "Não foi possível concluir a operação.");
  return result.data;
}
const money = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
type Order = RepairOrder & { totalCents: number };

export default function RepairWorkspace({
  role,
  initialQuery = "",
}: {
  role: "client" | "partner";
  initialQuery?: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState(initialQuery);
  async function reload() {
    setOrders((await api<{ orders: Order[] }>("/api/orders")).orders);
  }
  useEffect(() => {
    let active = true;
    async function load() {
      const result = await api<{ orders: Order[] }>("/api/orders");
      if (active) setOrders(result.orders);
    }
    void load()
      .catch((error: Error) => {
        if (active) setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const timer = setInterval(() => {
      void api<{ orders: Order[] }>("/api/orders")
        .then((data) => {
          if (active) setOrders(data.orders);
        })
        .catch(() => {});
    }, 30000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  async function act(id: string, action: unknown) {
    setBusy(true);
    setMessage("");
    try {
      await api(`/api/orders/${id}`, action, "PATCH");
      await reload();
      setMessage("Ordem atualizada.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const visible = orders.filter((order) =>
    `${order.device} ${order.id} ${ORDER_LABELS[order.status]}`
      .toLowerCase()
      .includes(filter.toLowerCase()),
  );
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <h1>{role === "client" ? "Meus reparos" : "Ordens de serviço"}</h1>
        <p className={styles.muted}>
          Triagem, orçamento e acompanhamento. Atualização automática a cada 30
          segundos.
        </p>
        {message && (
          <p role="status" className={styles.message}>
            {message}
          </p>
        )}
        {role === "client" && <p><Link href="/cliente/solicitar-reparo">+ Solicitar novo reparo</Link></p>}
        <label>
          Buscar por aparelho, código ou status
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </label>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          !visible.length && <p>Nenhuma ordem encontrada.</p>
        )}
        {visible.map((order) => (
          <article className={styles.card} key={order.id} id={order.id}>
            <span className={styles.status}>{ORDER_LABELS[order.status]}</span>
            <h2>{order.device}</h2>
            <p className={styles.muted}>O.S. {order.id}</p>
            <p>{order.problem}</p>
            <p className={styles.muted}>
              {[...order.symptoms, ...order.checklist].join(" · ")}
            </p>
            {order.diagnosis && (
              <p>
                <strong>Diagnóstico:</strong> {order.diagnosis}
              </p>
            )}
            {!!order.quote.length && (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Serviço / peça</th>
                      <th>Qtd.</th>
                      <th>Unitário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.quote.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.unitPriceCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h3>Total: {money(order.totalCents)}</h3>
              </>
            )}
            <ol className={styles.history}>
              {order.history.map((item, i) => (
                <li key={i}>
                  {ORDER_LABELS[item.status]}
                  <br />
                  {new Date(item.at).toLocaleString("pt-BR")}
                </li>
              ))}
            </ol>
            {role === "partner" &&
              ["pending", "quoted"].includes(order.status) && (
                <QuoteForm
                  busy={busy}
                  onSubmit={(body) => act(order.id, body)}
                />
              )}
            <div className={styles.actions}>
              {role === "client" && order.status === "quoted" && (
                <button
                  disabled={busy}
                  onClick={() => void act(order.id, { action: "approve" })}
                >
                  Aprovar {money(order.totalCents)}
                </button>
              )}
              {role === "client" &&
                ["pending", "quoted"].includes(order.status) && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm("Cancelar esta solicitação?"))
                        void act(order.id, { action: "cancel" });
                    }}
                  >
                    Cancelar solicitação
                  </button>
                )}
              {role === "partner" &&
                (
                  {
                    approved: ["in_progress"],
                    in_progress: ["waiting_parts", "ready"],
                    waiting_parts: ["in_progress"],
                    ready: ["completed"],
                  } as Partial<Record<OrderStatus, OrderStatus[]>>
                )[order.status]?.map((status) => (
                  <button
                    disabled={busy}
                    key={status}
                    onClick={() =>
                      void act(order.id, { action: "status", status })
                    }
                  >
                    {ORDER_LABELS[status]}
                  </button>
                ))}
            </div>
            {role === "client" &&
              order.status === "completed" &&
              !order.review && (
                <form
                  className={styles.form}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    void act(order.id, {
                      action: "review",
                      rating: Number(data.get("rating")),
                      comment: data.get("comment"),
                    });
                  }}
                >
                  <label>
                    Avaliação
                    <select name="rating">
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} estrelas
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Comentário
                    <textarea name="comment" maxLength={2000} />
                  </label>
                  <button disabled={busy}>Enviar avaliação</button>
                </form>
              )}
            {order.review && (
              <p>
                Avaliação: {order.review.rating}/5 — {order.review.comment}
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

function QuoteForm({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (body: unknown) => Promise<void>;
}) {
  const [count, setCount] = useState(1);
  return (
    <details>
      <summary>Preparar orçamento</summary>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const items = Array.from({ length: count }, (_, i) => ({
            name: data.get(`name-${i}`),
            quantity: Number(data.get(`quantity-${i}`)),
            unitPriceCents: Math.round(Number(data.get(`price-${i}`)) * 100),
          }));
          void onSubmit({
            action: "quote",
            diagnosis: data.get("diagnosis"),
            items,
          });
        }}
      >
        <label>
          Diagnóstico
          <textarea name="diagnosis" minLength={3} maxLength={3000} required />
        </label>
        {Array.from({ length: count }, (_, i) => (
          <div className={styles.grid} key={i}>
            <label>
              Serviço / peça
              <input name={`name-${i}`} maxLength={150} required />
            </label>
            <label>
              Quantidade
              <input
                type="number"
                name={`quantity-${i}`}
                min={1}
                max={100}
                defaultValue={1}
                required
              />
            </label>
            <label>
              Preço unitário (R$)
              <input
                name={`price-${i}`}
                type="number"
                min={0}
                max={100000}
                step="0.01"
                required
              />
            </label>
          </div>
        ))}
        <div className={styles.actions}>
          <button
            type="button"
            disabled={count >= 30}
            onClick={() => setCount(count + 1)}
          >
            + Item
          </button>
          <button disabled={busy}>Enviar orçamento ao cliente</button>
        </div>
      </form>
    </details>
  );
}
