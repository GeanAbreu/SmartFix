"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ClientProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./profile.module.css";

type ProfileData = { client: ClientProfile };
type EditableProfile = { nome: string; telefone: string };

function editableProfile(client: ClientProfile): EditableProfile {
  return { nome: client.nome ?? "", telefone: client.telefone ?? "" };
}

function initialsFor(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF";
}

export default function ClientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [form, setForm] = useState<EditableProfile>({ nome: "", telefone: "" });
  const [savedForm, setSavedForm] = useState<EditableProfile>({ nome: "", telefone: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/clients/me", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<ProfileData>(response);
      if (!response.ok || !result.success) {
        if (!result.success && result.redirectTo) { router.replace(result.redirectTo); return; }
        throw new Error(result.message || "Não foi possível carregar seu perfil.");
      }
      setProfile(result.data.client);
      setForm(editableProfile(result.data.client));
      setSavedForm(editableProfile(result.data.client));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Não foi possível carregar seu perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/clients/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<ProfileData>(response);
        if (!response.ok || !result.success) {
          if (!result.success && result.redirectTo) { router.replace(result.redirectTo); return; }
          throw new Error(result.message || "Não foi possível carregar seu perfil.");
        }
        if (active) {
          setProfile(result.data.client);
          setForm(editableProfile(result.data.client));
          setSavedForm(editableProfile(result.data.client));
        }
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Não foi possível carregar seu perfil.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [router]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess("");
    const input = { nome: form.nome.trim(), telefone: form.telefone.trim() };
    try {
      const response = await fetch("/api/clients/me", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível salvar as alterações.");
      setForm(input);
      setSavedForm(input);
      setProfile((current) => current ? { ...current, ...input } : current);
      setSaveSuccess("Seus dados foram atualizados.");
      window.dispatchEvent(new Event("smartfix:profile-updated"));
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  const displayName = profile?.nome?.trim() || "Cliente SmartFix";
  const changed = form.nome.trim() !== savedForm.nome.trim() || form.telefone.trim() !== savedForm.telefone.trim();

  return <main className={styles.page}>
    <section className={styles.mainArea}>
      <div className={styles.topLine}><Link href="/cliente/dashboard">← Voltar ao início</Link></div>
      <header className={styles.pageHeader}><span className={styles.eyebrow}>MINHA CONTA</span><h1>Meu perfil</h1><p>Gerencie seus dados pessoais e as opções de acesso à sua conta.</p></header>

      {loading ? <section className={styles.card} role="status"><p className={styles.stateMessage}>Carregando seu perfil...</p></section>
        : loadError ? <section className={styles.card} role="alert"><p className={styles.stateMessage}>{loadError}</p><button type="button" className={styles.secondaryButton} onClick={() => void loadProfile()}>Tentar novamente</button></section>
        : profile && <>
          <section className={styles.identityBanner} aria-label="Resumo da conta"><span className={styles.heroAvatar}>{initialsFor(displayName)}</span><div><span className={styles.eyebrow}>CONTA DE CLIENTE</span><h2>{displayName}</h2><p>{profile.email || "E-mail não informado"}</p></div></section>

          <div className={styles.contentGrid}>
            <section className={styles.card} aria-labelledby="personal-title">
              <div className={styles.cardHeading}><div><span className={styles.eyebrow}>DADOS PESSOAIS</span><h2 id="personal-title">Informações de contato</h2></div><p>Esses dados ajudam a assistência a falar com você durante o reparo.</p></div>
              {saveError && <p className={styles.error} role="alert">{saveError}</p>}
              {saveSuccess && <p className={styles.success} role="status">{saveSuccess}</p>}
              <form className={styles.form} onSubmit={(event) => void saveProfile(event)}>
                <label htmlFor="profile-name">Nome completo<input id="profile-name" autoComplete="name" value={form.nome} minLength={3} maxLength={150} required onChange={(event) => { setForm((current) => ({ ...current, nome: event.target.value })); setSaveSuccess(""); }} /></label>
                <label htmlFor="profile-phone">Telefone<input id="profile-phone" type="tel" autoComplete="tel" inputMode="tel" value={form.telefone} maxLength={20} required onChange={(event) => { setForm((current) => ({ ...current, telefone: event.target.value })); setSaveSuccess(""); }} /><small>Informe um número com DDD.</small></label>
                <div className={styles.formActions}><button type="submit" className={styles.primaryButton} disabled={saving || !changed}>{saving ? "Salvando..." : "Salvar alterações"}</button>{changed && <button type="button" className={styles.textButton} disabled={saving} onClick={() => { setForm(savedForm); setSaveError(""); setSaveSuccess(""); }}>Cancelar</button>}</div>
              </form>
            </section>

            <div className={styles.sideCards}>
              <section className={styles.card} aria-labelledby="account-title"><span className={styles.eyebrow}>CADASTRO</span><h2 id="account-title">Dados da conta</h2><dl className={styles.details}><div><dt>E-mail</dt><dd>{profile.email || "Não informado"}</dd></div><div><dt>CPF</dt><dd>{profile.cpf || "Não informado"}</dd></div></dl></section>
              <section className={styles.card} aria-labelledby="security-title"><span className={styles.eyebrow}>SEGURANÇA</span><h2 id="security-title">Acesso à conta</h2><p className={styles.sideDescription}>Mantenha suas opções de entrada atualizadas.</p><div className={styles.securityLinks}><a href="/api/auth/google?link=true">Vincular conta Google <span aria-hidden="true">↗</span></a><Link href="/esqueci-senha">Redefinir senha <span aria-hidden="true">→</span></Link></div></section>
            </div>
          </div>
        </>}
    </section>
  </main>;
}
