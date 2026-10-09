"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import type { ClientDevice } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import { initialRepairRequestDraft, type RepairRequestDraft } from "@/src/services/repair-request-draft";
import { CHECKLIST } from "@/src/types/workflow";
import styles from "./request.module.css";

type Partner = { id: string; name: string };
type Step = 1 | 2 | 3 | 4;
const PROBLEMS = [
  { label: "Não liga", icon: "◉", symptom: "Não liga / não carrega", hint: "Não dá sinal ou não inicia." },
  { label: "Tela", icon: "▣", symptom: "Tela quebrada / sem imagem", hint: "Trincada, sem imagem ou sem toque." },
  { label: "Bateria", icon: "▤", symptom: "Bateria descarrega rápido", hint: "Pouca autonomia ou desligamentos." },
  { label: "Áudio", icon: "◖", symptom: "Áudio / microfone ruim", hint: "Falha no som, microfone ou chamadas." },
  { label: "Aquecimento", icon: "♨", symptom: "Aquecimento excessivo", hint: "Esquenta além do normal." },
  { label: "Contato com líquido", icon: "◌", symptom: "Contato com líquido", hint: "Molhou ou falhou após contato." },
] as const;

async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  const result = await readApiResponse<T>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os dados.");
  return result.data;
}

export default function RepairRequest({ accountId, initialDeviceId, initialPartnerId }: { accountId: string; initialDeviceId: string; initialPartnerId: string }) {
  const draftKey = `smartfix-repair-draft:${accountId}`;
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [draft, setDraft] = useState<RepairRequestDraft>({ deviceId: initialDeviceId, partnerId: initialPartnerId, problem: "", symptoms: [], checklist: [] });
  const [step, setStep] = useState<Step>(initialPartnerId ? 2 : 1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");

  const load = useCallback(async (active: () => boolean) => {
    try {
      const [deviceData, partnerData] = await Promise.all([getData<{ devices: ClientDevice[] }>("/api/clients/devices"), getData<{ partners: Partner[] }>("/api/partners")]);
      if (!active()) return;
      setDevices(deviceData.devices); setPartners(partnerData.partners);
      let saved: unknown = {};
      try { saved = JSON.parse(localStorage.getItem(draftKey) || "{}"); } catch { /* Storage is optional. */ }
      setDraft(initialRepairRequestDraft(deviceData.devices, partnerData.partners, saved, initialDeviceId, initialPartnerId));
    } catch (caught) { if (active()) setError(caught instanceof Error ? caught.message : "Não foi possível carregar a solicitação."); }
    finally { if (active()) setLoading(false); }
  }, [draftKey, initialDeviceId, initialPartnerId]);

  useEffect(() => { let active = true; void Promise.resolve().then(() => load(() => active)); return () => { active = false; }; }, [load]);
  function retry() { setLoading(true); setError(""); void load(() => true); }
  function update(patch: Partial<RepairRequestDraft>) { const next = { ...draft, ...patch }; setDraft(next); try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Storage is optional. */ } }
  function changeDevice(deviceId: string) { const current = devices.find((item) => item.id === draft.deviceId); const next = devices.find((item) => item.id === deviceId); const inherited = current?.issueDescription || ""; update({ deviceId, problem: !draft.problem || draft.problem === inherited ? next?.issueDescription || "" : draft.problem }); }
  function toggleSymptom(symptom: string) { update({ symptoms: draft.symptoms.includes(symptom) ? draft.symptoms.filter((item) => item !== symptom) : [...draft.symptoms, symptom] }); }
  function go(next: Step) { setError(""); setStep(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function continueFlow() {
    if (step === 1 && !draft.deviceId) return setError("Escolha o aparelho que precisa de reparo.");
    if (step === 2 && draft.problem.trim().length < 10) return setError("Conte um pouco mais sobre o problema (mínimo de 10 caracteres).");
    if (step === 3 && !draft.partnerId) return setError("Escolha uma assistência para receber a solicitação.");
    go((step + 1) as Step);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const response = await fetch("/api/orders", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await readApiResponse<{ order: { id: string } }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a solicitação.");
      try { localStorage.removeItem(draftKey); } catch { /* Storage is optional. */ }
      setCreatedId(result.data.order.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível enviar a solicitação."); }
    finally { setBusy(false); }
  }

  const selectedDevice = devices.find((item) => item.id === draft.deviceId);
  const selectedPartner = partners.find((item) => item.id === draft.partnerId);
  const selectedCategory = useMemo(() => PROBLEMS.find((item) => draft.symptoms.includes(item.symptom)), [draft.symptoms]);

  return <main className={styles.page}>
    <section className={styles.hero}><div><p>REPARO / NOVA SOLICITAÇÃO</p><h1>Vamos cuidar do seu aparelho</h1><span>Leva poucos minutos. Seu progresso fica salvo para continuar depois.</span></div></section>
    <div className={styles.content}>
      {createdId ? <section className={styles.success} role="status"><span aria-hidden="true">✓</span><h2>Solicitação enviada</h2><p>A assistência recebeu seu pedido. O próximo passo é a análise e o envio do orçamento.</p><div className={styles.nextStep}><strong>O que acontece agora?</strong><span>1. A assistência analisa o relato</span><span>2. Você recebe o diagnóstico e o orçamento</span><span>3. O reparo só começa após sua aprovação</span></div><div className={styles.actions}><Link href={`/cliente/ordens?q=${encodeURIComponent(createdId)}`} className={styles.primary}>Acompanhar reparo</Link><Link href="/cliente/dashboard" className={styles.secondary}>Voltar ao início</Link></div></section> : <>
        <nav className={styles.progress} aria-label="Progresso da solicitação">{["Aparelho", "Problema", "Assistência", "Revisão"].map((label, index) => { const number = index + 1; return <button type="button" key={label} className={number === step ? styles.progressActive : number < step ? styles.progressDone : ""} disabled={number > step} onClick={() => number < step && go(number as Step)}><span>{number < step ? "✓" : number}</span>{label}</button>; })}</nav>
        <div className={styles.stepMeta}><span>ETAPA {step} DE 4</span><small>Rascunho salvo automaticamente</small></div>
        {loading ? <div className={styles.panel} role="status">Preparando sua solicitação...</div> : error && (!devices.length || !partners.length) ? <div className={styles.error} role="alert">{error} <button type="button" onClick={retry}>Tentar novamente</button></div> : !devices.length ? <div className={styles.panel}><h3>Cadastre um aparelho primeiro</h3><p>Você precisa de um dispositivo cadastrado para solicitar o reparo.</p><Link className={styles.primary} href="/cliente/dispositivos">Cadastrar dispositivo</Link></div> : <form onSubmit={submit} className={styles.wizard}>
          {step === 1 && <section className={styles.panel}><div className={styles.sectionTitle}><span>01</span><div><h2>Qual aparelho precisa de reparo?</h2><p>Selecione um aparelho cadastrado ou adicione um novo.</p></div></div><div className={styles.choiceGrid}>{devices.map((device) => <button type="button" key={device.id} className={`${styles.choiceCard} ${draft.deviceId === device.id ? styles.choiceSelected : ""}`} onClick={() => changeDevice(device.id)}><span className={styles.deviceIcon}>▯</span><strong>{device.apelido || `${device.marca} ${device.modelo}`}</strong><small>{device.marca} {device.modelo}</small>{draft.deviceId === device.id && <b>✓ Selecionado</b>}</button>)}<Link className={styles.addCard} href="/cliente/dispositivos">＋<strong>Cadastrar outro aparelho</strong></Link></div></section>}
          {step === 2 && <section className={styles.panel}><div className={styles.sectionTitle}><span>02</span><div><h2>O que aconteceu?</h2><p>Escolha a opção mais próxima. Não é preciso conhecer termos técnicos.</p></div></div><div className={styles.problemGrid}>{PROBLEMS.map((item) => <button type="button" key={item.label} className={`${styles.problemCard} ${draft.symptoms.includes(item.symptom) ? styles.choiceSelected : ""}`} onClick={() => toggleSymptom(item.symptom)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.hint}</small></button>)}<button type="button" className={styles.problemCard} onClick={() => document.getElementById("problem-description")?.focus()}><span>＋</span><strong>Outro problema</strong><small>Descreva com suas próprias palavras.</small></button></div><label className={styles.descriptionLabel} htmlFor="problem-description">Conte mais detalhes<textarea id="problem-description" value={draft.problem} onChange={(event) => update({ problem: event.target.value })} placeholder="Ex.: começou ontem, o aparelho caiu e agora a tela acende, mas não responde ao toque." minLength={10} maxLength={3000} required /><small>Informe quando começou e o que você já tentou · {draft.problem.length}/3000</small></label><fieldset><legend>Como está o aparelho? <small>(opcional)</small></legend><div className={styles.checkGrid}>{CHECKLIST.map((item) => <label key={item} className={styles.check}><input type="checkbox" checked={draft.checklist.includes(item)} onChange={(event) => update({ checklist: event.target.checked ? [...draft.checklist, item] : draft.checklist.filter((value) => value !== item) })} />{item}</label>)}</div></fieldset></section>}
          {step === 3 && <section className={styles.panel}><div className={styles.sectionTitle}><span>03</span><div><h2>Escolha uma assistência</h2><p>Todos os profissionais exibidos foram aprovados pela SmartFix.</p></div></div>{partners.length ? <div className={styles.partnerGrid}>{partners.map((partner) => <button type="button" key={partner.id} className={`${styles.partnerCard} ${draft.partnerId === partner.id ? styles.choiceSelected : ""}`} onClick={() => update({ partnerId: partner.id })}><span className={styles.monogram}>{partner.name.slice(0, 2).toUpperCase()}</span><span><strong>{partner.name}</strong><small>✓ Parceiro aprovado</small></span><b>{draft.partnerId === partner.id ? "Selecionada" : "Escolher"}</b></button>)}</div> : <p>Nenhuma assistência disponível no momento.</p>}<div className={styles.finderCallout}><div><strong>Quer comparar distância, serviços e avaliações?</strong><p>Use a busca para encontrar a melhor opção perto de você. Seu rascunho continuará salvo.</p></div><Link className={styles.secondary} href={`/cliente/assistencias?deviceId=${encodeURIComponent(draft.deviceId)}`}>Comparar assistências →</Link></div></section>}
          {step === 4 && <section className={styles.panel}><div className={styles.sectionTitle}><span>04</span><div><h2>Revise antes de enviar</h2><p>O reparo não começa sem sua aprovação do orçamento.</p></div></div><div className={styles.reviewGrid}><article><small>APARELHO</small><strong>{selectedDevice ? `${selectedDevice.marca} ${selectedDevice.modelo}` : "Não selecionado"}</strong><button type="button" onClick={() => go(1)}>Alterar</button></article><article><small>PROBLEMA</small><strong>{selectedCategory?.label || "Descrição personalizada"}</strong><p>{draft.problem}</p><button type="button" onClick={() => go(2)}>Alterar</button></article><article><small>ASSISTÊNCIA</small><strong>{selectedPartner?.name || "Não selecionada"}</strong><button type="button" onClick={() => go(3)}>Alterar</button></article></div><div className={styles.safetyNote}><strong>Você mantém o controle</strong><p>A assistência enviará preço, prazo e garantia. Você poderá revisar tudo antes de agendar e pagar.</p></div></section>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.wizardActions}>{step > 1 ? <button type="button" className={styles.secondary} onClick={() => go((step - 1) as Step)}>← Voltar</button> : <Link href="/cliente/dashboard" className={styles.cancel}>Cancelar</Link>}{step < 4 ? <button type="button" className={styles.primary} onClick={continueFlow}>Continuar →</button> : <button type="submit" disabled={busy} className={styles.primary}>{busy ? "Enviando..." : "Enviar solicitação"}</button>}</div>
        </form>}
      </>}
    </div>
  </main>;
}
