"use client";

import { useState, type FormEvent } from "react";
import type { RepairOrder } from "@/src/types/workflow";
import { readApiResponse } from "@/src/services/api-response.service";
import modalStyles from "./payment-provider-modal.module.css";

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
      const response = await fetch("/api/payments/infinitepay/checkout", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, payment: "infinitepay" }),
      });
      const result = await readApiResponse<{ checkoutUrl: string }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível iniciar o pagamento.");
      window.location.href = result.data.checkoutUrl;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar o pagamento.");
      setRedirecting(false);
    }
  }

  return <div className={modalStyles.backdrop} role="presentation" onMouseDown={(event) => {
    if (event.target === event.currentTarget && !redirecting) onCancel();
  }}>
    <form className={modalStyles.modal} role="dialog" aria-modal="true" aria-labelledby="payment-provider-title" onSubmit={submit}>
      <button type="button" className={modalStyles.close} aria-label="Fechar" disabled={redirecting} onClick={onCancel}>×</button>
      <div className={modalStyles.header}><div><span>PAGAMENTO SMARTFIX</span><h3 id="payment-provider-title">Checkout seguro InfinitePay</h3><p>Pix e cartão são processados exclusivamente pela conta central da SmartFix.</p></div><strong>{money(order.totalCents)}</strong></div>
      {error && <p className={modalStyles.error} role="alert">{error}</p>}
      <div className={modalStyles.actions}><button type="button" className={modalStyles.cancel} disabled={busy || redirecting} onClick={onCancel}>Cancelar</button><button className={modalStyles.continue} disabled={busy || redirecting}>{redirecting ? "Abrindo checkout…" : "Pagar com InfinitePay"}</button></div>
      <small className={modalStyles.security}>🔒 Seus dados de pagamento são informados somente no ambiente seguro da InfinitePay.</small>
    </form>
  </div>;
}
