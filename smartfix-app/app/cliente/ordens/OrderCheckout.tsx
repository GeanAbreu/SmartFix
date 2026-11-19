"use client";

import { useState, type FormEvent } from "react";
import type { RepairOrder } from "@/src/types/workflow";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./prototype-integration.module.css";

type Order = RepairOrder & { totalCents: number };
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function OrderCheckout({ order, busy, onCancel }: {
  order: Order; busy: boolean; onCancel: () => void;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedirecting(true); setError("");
    try {
      const response = await fetch("/api/payments/mercado-pago/checkout", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const result = await readApiResponse<{ checkoutUrl: string }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível iniciar o pagamento.");
      window.location.assign(result.data.checkoutUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
      setRedirecting(false);
    }
  }

  return <form className={styles.checkout} onSubmit={submit}>
    <div className={styles.checkoutHeader}><div><span className={styles.eyebrow}>PAGAMENTO</span><h4>Finalize o serviço</h4></div><strong>{money(order.totalCents)}</strong></div>
    <p className={styles.checkoutNote}>Você será redirecionado ao Mercado Pago. A assistência só poderá iniciar após a confirmação do pagamento.</p>
    {error && <p className={styles.checkoutNote} role="alert">{error}</p>}
    <div className={styles.actions}><button className={styles.primary} disabled={busy || redirecting}>{redirecting ? "Abrindo Mercado Pago…" : `Pagar ${money(order.totalCents)}`}</button><button type="button" className={styles.secondary} disabled={busy || redirecting} onClick={onCancel}>Voltar</button></div>
  </form>;
}
