"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { ClientDevice } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import { initialRepairRequestDraft, type RepairRequestDraft } from "@/src/services/repair-request-draft";
import { CHECKLIST, SYMPTOMS } from "@/src/types/workflow";
import styles from "./request.module.css";

type Partner = { id: string; name: string };

async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  const result = await readApiResponse<T>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os dados.");
  return result.data;
}

export default function RepairRequest({ accountId, initialDeviceId, initialPartnerId }: {
  accountId: string;
  initialDeviceId: string;
  initialPartnerId: string;
}) {
  const draftKey = `smartfix-repair-draft:${accountId}`;
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [draft, setDraft] = useState<RepairRequestDraft>({ deviceId: initialDeviceId, partnerId: initialPartnerId, problem: "", symptoms: [], checklist: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  const load = useCallback(async (active: () => boolean) => {
    try {
      const [deviceData, partnerData] = await Promise.all([
        getData<{ devices: ClientDevice[] }>("/api/clients/devices"),
        getData<{ partners: Partner[] }>("/api/partners"),
      ]);
      if (!active()) return;
      setDevices(deviceData.devices);
      setPartners(partnerData.partners);
      let saved: unknown = {};
      try { saved = JSON.parse(sessionStorage.getItem(draftKey) || "{}"); } catch { /* Optional draft. */ }
      setDraft(initialRepairRequestDraft(deviceData.devices, partnerData.partners, saved, initialDeviceId, initialPartnerId));
    } catch (caught) {
      if (active()) setError(caught instanceof Error ? caught.message : "Não foi possível carregar a solicitação.");
    } finally {
      if (active()) setLoading(false);
    }
  }, [draftKey, initialDeviceId, initialPartnerId]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => load(() => active));
    return () => { active = false; };
  }, [load]);

  function retry() {
    setLoading(true);
    setError("");
    void load(() => true);
  }

  function update(patch: Partial<RepairRequestDraft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    try { sessionStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Optional draft. */ }
  }

  function changeDevice(deviceId: string) {
    const current = devices.find((device) => device.id === draft.deviceId);
    const next = devices.find((device) => device.id === deviceId);
    const inheritedProblem = current?.issueDescription || current?.issueType || "";
    update({ deviceId, problem: !draft.problem || draft.problem === inheritedProblem
      ? next?.issueDescription || next?.issueType || "" : draft.problem });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const result = await readApiResponse<{ order: { id: string } }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a solicitação.");
      try { sessionStorage.removeItem(draftKey); } catch { /* Optional draft. */ }
      setCreatedId(result.data.order.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar a solicitação.");
    } finally {
      setBusy(false);
    }
  }

  const selectedDevice = devices.find((device) => device.id === draft.deviceId);
  const selectedPartner = partners.find((partner) => partner.id === draft.partnerId);

  return <main className={styles.page}>
    <section className={styles.hero}><div><p>REPARO / NOVA SOLICITAÇÃO</p><h1>Solicitar reparo</h1><span>Conte o que aconteceu com seu aparelho e escolha uma assistência.</span></div></section>
    <div className={styles.content}>
      {createdId ? <section className={styles.success} role="status">
        <span aria-hidden="true">✓</span><h2>Solicitação enviada</h2>
        <p>A assistência recebeu seu pedido. Você pode acompanhar as próximas etapas em Meus reparos.</p>
        <div className={styles.actions}><Link href={`/cliente/ordens?q=${encodeURIComponent(createdId)}`} className={styles.primary}>Acompanhar reparo</Link><Link href="/cliente/dashboard" className={styles.secondary}>Voltar ao início</Link></div>
      </section> : <>
        <div className={styles.intro}><div><span className={styles.eyebrow}>NOVA ORDEM</span><h2>Dados da solicitação</h2><p>Confira o aparelho, descreva o problema e informe o estado em que ele será entregue.</p></div><Link href="/cliente/ordens">Ver meus reparos →</Link></div>
        {loading ? <div className={styles.panel} role="status">Carregando aparelhos e assistências...</div>
        : error && (!devices.length || !partners.length) ? <div className={styles.error} role="alert">{error} <button type="button" onClick={retry}>Tentar novamente</button></div>
        : !devices.length ? <div className={styles.panel}><h3>Cadastre um aparelho primeiro</h3><p>Você precisa de um dispositivo cadastrado para solicitar o reparo.</p><Link className={styles.primary} href="/cliente/dispositivos">Cadastrar dispositivo</Link></div>
        : !partners.length ? <div className={styles.panel}><h3>Nenhuma assistência disponível</h3><p>Não há parceiros aprovados para receber solicitações no momento.</p><Link className={styles.secondary} href="/cliente/assistencias">Ver assistências</Link></div>
        : <form onSubmit={submit} className={styles.layout}>
          <div className={styles.formColumn}>
            <section className={styles.panel}>
              <div className={styles.sectionTitle}><span>01</span><div><h3>Aparelho e assistência</h3><p>Escolha quem receberá o pedido.</p></div></div>
              <div className={styles.fields}>
                <label>Aparelho<select value={draft.deviceId} onChange={(event) => changeDevice(event.target.value)} required>{devices.map((device) => <option key={device.id} value={device.id}>{device.apelido || `${device.marca} ${device.modelo}`} · {device.marca} {device.modelo}</option>)}</select></label>
                <label>Assistência<select value={draft.partnerId} onChange={(event) => update({ partnerId: event.target.value })} required><option value="">Selecione uma assistência</option>{partners.map((partner) => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label>
              </div>
              <Link className={styles.textLink} href={`/cliente/assistencias?deviceId=${encodeURIComponent(draft.deviceId)}`}>Encontrar assistência próxima →</Link>
            </section>
            <section className={styles.panel}>
              <div className={styles.sectionTitle}><span>02</span><div><h3>Problema do aparelho</h3><p>Seu relato ajuda a assistência a preparar o diagnóstico.</p></div></div>
              {selectedDevice?.issueType && <p className={styles.deviceIssue}>Tipo informado no cadastro: <strong>{selectedDevice.issueType}</strong></p>}
              <label>Descreva o problema<textarea value={draft.problem} onChange={(event) => update({ problem: event.target.value })} placeholder="Explique o defeito, quando começou e o que já tentou fazer." minLength={10} maxLength={3000} required /><small>Mínimo de 10 caracteres · {draft.problem.length}/3000</small></label>
            </section>
            <section className={styles.panel}>
              <div className={styles.sectionTitle}><span>03</span><div><h3>Triagem inicial</h3><p>Marque apenas o que se aplica ao aparelho.</p></div></div>
              <fieldset><legend>Sintomas</legend><div className={styles.checkGrid}>{SYMPTOMS.map((item) => <label key={item} className={styles.check}><input type="checkbox" checked={draft.symptoms.includes(item)} onChange={(event) => update({ symptoms: event.target.checked ? [...draft.symptoms, item] : draft.symptoms.filter((value) => value !== item) })} />{item}</label>)}</div></fieldset>
              <fieldset><legend>Estado e acessórios</legend><div className={styles.checkGrid}>{CHECKLIST.map((item) => <label key={item} className={styles.check}><input type="checkbox" checked={draft.checklist.includes(item)} onChange={(event) => update({ checklist: event.target.checked ? [...draft.checklist, item] : draft.checklist.filter((value) => value !== item) })} />{item}</label>)}</div></fieldset>
            </section>
          </div>
          <aside className={styles.summary}>
            <span className={styles.eyebrow}>RESUMO DO PEDIDO</span><h3>Pronto para enviar?</h3>
            <div><small>Aparelho</small><strong>{selectedDevice ? `${selectedDevice.marca} ${selectedDevice.modelo}` : "Selecione um aparelho"}</strong></div>
            <div><small>Assistência</small><strong>{selectedPartner?.name || "Selecione uma assistência"}</strong></div>
            <p>A assistência fará o diagnóstico e enviará um orçamento para sua aprovação antes de iniciar o reparo.</p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button type="submit" disabled={busy || !draft.partnerId} className={styles.primary}>{busy ? "Enviando..." : "Enviar solicitação"}</button>
            <Link href="/cliente/ordens" className={styles.cancel}>Cancelar e voltar</Link>
          </aside>
        </form>}
      </>}
    </div>
  </main>;
}
