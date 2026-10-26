"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import type { PartnerProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "@/app/cliente/perfil/profile.module.css";

type Form = { companyName: string; phone: string };
const editable = (profile: PartnerProfile): Form => ({ companyName: profile.companyName || "", phone: profile.phone || "" });
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF";

export default function PartnerProfilePage() {
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [form, setForm] = useState<Form>({ companyName: "", phone: "" });
  const [saved, setSaved] = useState<Form>({ companyName: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/partners/me", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ partner: PartnerProfile }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os dados da assistência.");
      const next = editable(result.data.partner); setProfile(result.data.partner); setForm(next); setSaved(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados da assistência."); }
    finally { setLoading(false); }
  }

  useEffect(() => { let active = true; void fetch("/api/partners/me", { credentials: "include", cache: "no-store" }).then(async (response) => {
    const result = await readApiResponse<{ partner: PartnerProfile }>(response);
    if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os dados da assistência.");
    if (active) { const next = editable(result.data.partner); setProfile(result.data.partner); setForm(next); setSaved(next); }
  }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados da assistência."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (saving) return; setSaving(true); setError(""); setSuccess("");
    const input = { companyName: form.companyName.trim(), phone: form.phone.trim() };
    try {
      const response = await fetch("/api/partners/me", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível salvar as alterações.");
      setForm(input); setSaved(input); setProfile((current) => current ? { ...current, ...input } : current); setSuccess("Dados da assistência atualizados.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar as alterações."); }
    finally { setSaving(false); }
  }

  const name = profile?.companyName || profile?.name || "Assistência SmartFix";
  const changed = form.companyName.trim() !== saved.companyName || form.phone.trim() !== saved.phone;
  return <main className={styles.page}><section className={styles.mainArea}>
    <div className={styles.topLine}><Link href="/parceiro/dashboard">← Voltar ao início</Link></div>
    <header className={styles.pageHeader}><span className={styles.eyebrow}>CONFIGURAÇÕES</span><h1>Minha assistência</h1><p>Mantenha os dados da empresa e as opções de acesso atualizados.</p></header>
    {loading ? <section className={styles.card} role="status"><p className={styles.stateMessage}>Carregando dados...</p></section> : error && !profile ? <section className={styles.card} role="alert"><p className={styles.stateMessage}>{error}</p><button className={styles.secondaryButton} onClick={() => void load()}>Tentar novamente</button></section> : profile && <>
      <section className={styles.identityBanner}><span className={styles.heroAvatar}>{initials(name)}</span><div><span className={styles.eyebrow}>{profile.isVerified ? "ASSISTÊNCIA APROVADA" : "CREDENCIAMENTO EM ANÁLISE"}</span><h2>{name}</h2><p>{profile.email}</p></div></section>
      <div className={styles.contentGrid}><section className={styles.card}><div className={styles.cardHeading}><div><span className={styles.eyebrow}>DADOS PÚBLICOS</span><h2>Informações da assistência</h2></div><p>Esses dados identificam sua empresa para clientes e entregadores.</p></div>{error && <p className={styles.error} role="alert">{error}</p>}{success && <p className={styles.success} role="status">{success}</p>}
        <form className={styles.form} onSubmit={(event) => void save(event)}><label>Nome da assistência<input value={form.companyName} minLength={3} maxLength={150} required onChange={(event) => { setForm((current) => ({ ...current, companyName: event.target.value })); setSuccess(""); }} /></label><label>Telefone / WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" value={form.phone} minLength={10} maxLength={20} required onChange={(event) => { setForm((current) => ({ ...current, phone: event.target.value })); setSuccess(""); }} /><small>Usado no atendimento e na logística de coleta e entrega.</small></label><div className={styles.formActions}><button className={styles.primaryButton} disabled={saving || !changed}>{saving ? "Salvando..." : "Salvar alterações"}</button>{changed && <button type="button" className={styles.textButton} onClick={() => { setForm(saved); setError(""); setSuccess(""); }}>Cancelar</button>}</div></form>
      </section><div className={styles.sideCards}><section className={styles.card}><span className={styles.eyebrow}>CONTA</span><h2>Dados protegidos</h2><dl className={styles.details}><div><dt>E-mail</dt><dd>{profile.email}</dd></div><div><dt>Responsável</dt><dd>{profile.name}</dd></div><div><dt>Status</dt><dd>{profile.isVerified ? "Aprovada" : "Em análise"}</dd></div></dl></section><section className={styles.card}><span className={styles.eyebrow}>SEGURANÇA E SUPORTE</span><h2>Acesso à conta</h2><div className={styles.securityLinks}><a href="/api/auth/google?link=true">Vincular conta Google <span>↗</span></a><Link href="/esqueci-senha">Redefinir senha <span>→</span></Link><Link href="/parceiro/mensagens">Falar com a SmartFix <span>→</span></Link></div></section></div></div>
    </>}
  </section></main>;
}
