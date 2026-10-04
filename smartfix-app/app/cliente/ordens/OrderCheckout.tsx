"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ClientAddress } from "@/src/types/api";
import type { RepairOrder } from "@/src/types/workflow";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./prototype-integration.module.css";

type Order = RepairOrder & { totalCents: number };
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const addressLabel = (address: ClientAddress) => `${address.logradouro}, ${address.numero}${address.complemento ? ` — ${address.complemento}` : ""} · ${address.bairro}, ${address.cidade}/${address.estado} · CEP ${address.cep}`;

export default function OrderCheckout({ order, busy, onCancel, onConfirm }: {
  order: Order; busy: boolean; onCancel: () => void; onConfirm: (body: Record<string, unknown>) => Promise<void>;
}) {
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(true);
  const discount = useMemo(() => coupon.trim().toUpperCase() === "SMART10"
    ? Math.round((order.totalCents - order.serviceDetails.deliveryFeeCents) * .1) : 0,
  [coupon, order]);
  useEffect(() => {
    let active = true;
    void fetch("/api/clients/addresses", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<{ addresses: ClientAddress[] }>(response);
        if (!response.ok || !result.success) throw new Error(result.message);
        if (!active) return;
        setAddresses(result.data.addresses);
        const primary = result.data.addresses.find((item) => item.principal) || result.data.addresses[0];
        if (primary) setAddress(addressLabel(primary));
      }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void onConfirm({ action: "approve", scheduledDate: data.get("scheduledDate"),
      schedulePeriod: data.get("schedulePeriod"), serviceAddress: address,
      paymentMethod: data.get("paymentMethod"), couponCode: coupon });
  }

  return <form className={styles.checkout} onSubmit={submit}>
    <div className={styles.checkoutHeader}><div><span className={styles.eyebrow}>AGENDAMENTO E CHECKOUT</span><h4>Finalize o serviço</h4></div><strong>{money(order.totalCents - discount)}</strong></div>
    <div className={styles.checkoutGrid}>
      <label>Data da coleta<input name="scheduledDate" type="date" required /></label>
      <label>Turno<select name="schedulePeriod" required><option value="morning">Manhã · 08h às 12h</option><option value="afternoon">Tarde · 13h às 18h</option></select></label>
      <label className={styles.wide}>Endereço de coleta e entrega
        {loading ? <span>Carregando endereços…</span> : addresses.length ? <select value={address} onChange={(event) => setAddress(event.target.value)}>{addresses.map((item) => <option key={item.id} value={addressLabel(item)}>{item.apelido || "Endereço"} · {addressLabel(item)}</option>)}</select> : <input value={address} onChange={(event) => setAddress(event.target.value)} minLength={8} placeholder="Informe o endereço completo" required />}
      </label>
      <label>Cupom<input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="Use SMART10" /></label>
      <fieldset><legend>Forma de pagamento</legend><label><input type="radio" name="paymentMethod" value="pix" defaultChecked /> PIX</label><label><input type="radio" name="paymentMethod" value="card" /> Cartão</label></fieldset>
    </div>
    {discount > 0 && <p className={styles.discount}>Cupom SMART10 aplicado: − {money(discount)}</p>}
    <p className={styles.checkoutNote}>Ao confirmar, o pagamento demonstrativo será registrado e a assistência poderá iniciar o reparo.</p>
    <div className={styles.actions}><button className={styles.primary} disabled={busy || !address}>{busy ? "Confirmando…" : `Confirmar e pagar ${money(order.totalCents - discount)}`}</button><button type="button" className={styles.secondary} disabled={busy} onClick={onCancel}>Voltar</button></div>
  </form>;
}
