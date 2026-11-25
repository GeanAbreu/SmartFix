"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import type { PartnerProfile } from "@/src/types/api";
import type { RepairOrder } from "@/src/types/workflow";
import styles from "./finance.module.css";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const grossFor = (order: RepairOrder) => order.quote.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0) - (order.serviceDetails.discountCents || 0);

export default function PartnerFinance() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ordersResponse, profileResponse] = await Promise.all([
        fetch("/api/orders", { credentials: "include", cache: "no-store" }),
        fetch("/api/partners/me", { credentials: "include", cache: "no-store" }),
      ]);
      const ordersResult = await readApiResponse<{ orders: RepairOrder[] }>(ordersResponse);
      const profileResult = await readApiResponse<{ partner: PartnerProfile }>(profileResponse);
      if (!ordersResponse.ok || !ordersResult.success) throw new Error(ordersResult.message || "Não foi possível carregar os repasses.");
      if (!profileResponse.ok || !profileResult.success) throw new Error(profileResult.message || "Não foi possível carregar o cadastro.");
      setOrders(ordersResult.data.orders); setProfile(profileResult.data.partner);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar o financeiro."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const frame = requestAnimationFrame(() => void load()); return () => cancelAnimationFrame(frame); }, [load]);

  async function savePix(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const pixKey = String(new FormData(event.currentTarget).get("pixKey") || "").trim();
    try {
      const response = await fetch("/api/partners/pix", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pixKey }) });
      const result = await readApiResponse<{ pixKey: string }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível salvar a chave PIX.");
      setProfile((current) => current ? { ...current, pixKey: result.data.pixKey } : current);
      setNotice("Chave PIX atualizada com segurança.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar a chave PIX."); }
    finally { setSaving(false); }
  }

  const eligible = useMemo(() => orders.filter((order) => order.status === "completed" && order.serviceDetails.paymentStatus === "confirmed"), [orders]);
  const pending = eligible.filter((order) => order.serviceDetails.payoutStatus !== "paid");
  const paid = eligible.filter((order) => order.serviceDetails.payoutStatus === "paid");
  const pendingNet = pending.reduce((sum, order) => sum + (order.serviceDetails.payoutNetCents ?? grossFor(order) - (order.serviceDetails.payoutFeeCents ?? 0)), 0);
  const paidNet = paid.reduce((sum, order) => sum + (order.serviceDetails.payoutNetCents ?? grossFor(order) - (order.serviceDetails.payoutFeeCents ?? 0)), 0);

  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><span>REPASSES SMARTFIX</span><h1>Financeiro</h1><p>Acompanhe os valores centralizados e os repasses da sua assistência.</p></div><button onClick={() => void load()} disabled={loading}>{loading ? "Atualizando…" : "Atualizar"}</button></header>
    {error && <div className={styles.error} role="alert">{error}</div>}{notice && <div className={styles.success} role="status">{notice}</div>}
    <section className={styles.schedule}><strong>Calendário de repasses</strong><p>Os repasses referentes aos serviços concluídos são realizados pela equipe da SmartFix todas as quartas-feiras, às 10h00 da manhã.</p></section>
    <section className={styles.paymentAccount}><div><span>CHAVE PIX OBRIGATÓRIA</span><h2>Dados para recebimento</h2><p>Cadastre a chave usada pela equipe SmartFix para efetuar seus repasses.</p><p><strong>A chave PIX deve estar obrigatoriamente vinculada ao CPF do proprietário da empresa ou ao CNPJ da assistência.</strong></p></div><form className={styles.connection} onSubmit={savePix}><label htmlFor="pixKey">Chave PIX<input id="pixKey" name="pixKey" defaultValue={profile?.pixKey || ""} required minLength={5} maxLength={150} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" /></label><button disabled={saving}>{saving ? "Salvando…" : profile?.pixKey ? "Atualizar chave PIX" : "Cadastrar chave PIX"}</button><small>Confira a titularidade antes de salvar. Dados incorretos podem atrasar o repasse.</small></form></section>
    <section className={styles.metrics}><article className={styles.highlight}><span>Valores a receber</span><strong>{loading ? "—" : money.format(pendingNet / 100)}</strong><small>{pending.length} OS{pending.length === 1 ? "" : "s"} aguardando a próxima quarta-feira</small></article><article><span>Repasses efetuados</span><strong>{loading ? "—" : money.format(paidNet / 100)}</strong><small>{paid.length} repasse{paid.length === 1 ? "" : "s"} confirmado{paid.length === 1 ? "" : "s"}</small></article></section>
    <section className={styles.panel}><div className={styles.panelHeader}><div><h2>Detalhamento por Ordem de Serviço</h2><p>Serviços pagos e concluídos, organizados pelo status do repasse.</p></div></div>{loading ? <p className={styles.empty}>Carregando repasses…</p> : eligible.length === 0 ? <p className={styles.empty}>Nenhuma OS concluída e paga disponível para repasse.</p> : <div className={styles.tableWrap}><table><thead><tr><th>OS</th><th>Conclusão</th><th>Valor bruto</th><th>Taxas</th><th>Valor líquido</th><th>Status do repasse</th></tr></thead><tbody>{eligible.map((order) => { const gross = grossFor(order); const fee = order.serviceDetails.payoutFeeCents ?? 0; const net = order.serviceDetails.payoutNetCents ?? gross - fee; const isPaid = order.serviceDetails.payoutStatus === "paid"; return <tr key={order.id}><td><strong>#{order.id}</strong><small>{order.device}</small></td><td>{date.format(new Date(order.serviceDetails.deliveredAt || order.createdAt))}</td><td>{money.format(gross / 100)}</td><td>{fee ? money.format(fee / 100) : "Sem taxas"}</td><td><strong>{money.format(net / 100)}</strong></td><td><span className={isPaid ? styles.paid : styles.pending}>{isPaid ? "Pago" : "Aguardando repasse"}</span>{isPaid && order.serviceDetails.payoutPaidAt && <small>{date.format(new Date(order.serviceDetails.payoutPaidAt))}</small>}</td></tr>; })}</tbody></table></div>}</section>
  </div></main>;
}
