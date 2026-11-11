"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import { initialRepairRequestDraft, type RepairRequestDraft } from "@/src/services/repair-request-draft";
import { CHECKLIST } from "@/src/types/workflow";
import { DEVICE_TYPES, getDeviceBrands, getDeviceModels } from "@/src/constants/device-catalog";
import styles from "./request.module.css";

type Partner = { id: string; name: string; rating: number | null; reviewCount: number; serviceCount: number; startingPriceCents: number | null; fastestDays: number | null };
type Step = 1 | 2 | 3;
const PROBLEMS = [
  { label: "Não liga", icon: "◉", symptom: "Não liga / não carrega", hint: "Não dá sinal ou não inicia." },
  { label: "Tela", icon: "▣", symptom: "Tela quebrada / sem imagem", hint: "Trincada, sem imagem ou sem toque." },
  { label: "Bateria", icon: "▤", symptom: "Bateria descarrega rápido", hint: "Pouca autonomia ou desligamentos." },
  { label: "Áudio", icon: "◖", symptom: "Áudio / microfone ruim", hint: "Falha no som, microfone ou chamadas." },
  { label: "Aquecimento", icon: "♨", symptom: "Aquecimento excessivo", hint: "Esquenta além do normal." },
  { label: "Contato com líquido", icon: "◌", symptom: "Contato com líquido", hint: "Molhou ou falhou após contato." },
] as const;
const MAX_PHOTO_BYTES = 1_500_000;
const SUPPORTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

async function getData<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  const result = await readApiResponse<T>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os dados.");
  return result.data;
}

export default function RepairRequest({ accountId, initialPartnerId }: { accountId: string; initialPartnerId: string }) {
  const draftKey = `smartfix-repair-draft:${accountId}`;
  const [partners, setPartners] = useState<Partner[]>([]);
  const [draft, setDraft] = useState<RepairRequestDraft>({ deviceId: "", deviceType: "", deviceBrand: "", deviceModel: "", deviceColor: "", devicePhotos: [], partnerId: initialPartnerId, problem: "", symptoms: [], checklist: [] });
  const [step, setStep] = useState<Step>(initialPartnerId ? 2 : 1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState("");
  const [partnerSort, setPartnerSort] = useState<"recommended" | "rating" | "price" | "time">("recommended");

  const load = useCallback(async (active: () => boolean) => {
    try {
      const partnerData = await getData<{ partners: Partner[] }>("/api/partners");
      if (!active()) return;
      setPartners(partnerData.partners);
      let saved: unknown = {};
      try { saved = JSON.parse(localStorage.getItem(draftKey) || "{}"); } catch { /* Storage is optional. */ }
      setDraft(initialRepairRequestDraft([], partnerData.partners, saved, "", initialPartnerId));
    } catch (caught) { if (active()) setError(caught instanceof Error ? caught.message : "Não foi possível carregar a solicitação."); }
    finally { if (active()) setLoading(false); }
  }, [draftKey, initialPartnerId]);

  useEffect(() => { let active = true; void Promise.resolve().then(() => load(() => active)); return () => { active = false; }; }, [load]);
  function retry() { setLoading(true); setError(""); void load(() => true); }
  function update(patch: Partial<RepairRequestDraft>) { const next = { ...draft, ...patch }; setDraft(next); try { localStorage.setItem(draftKey, JSON.stringify(next)); } catch { /* Storage is optional. */ } }
  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files || [])].slice(0, 3);
    if (files.some((file) => !SUPPORTED_PHOTO_TYPES.includes(file.type))) return setError("Envie apenas fotos JPG, PNG ou WebP.");
    if (files.some((file) => file.size > MAX_PHOTO_BYTES)) return setError("Cada foto deve ter no máximo 1,5 MB.");
    Promise.all(files.map((file) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(); reader.onerror = reject; reader.readAsDataURL(file); })))
      .then((photos) => { update({ devicePhotos: photos }); setError(""); })
      .catch(() => setError("Não foi possível ler as fotos selecionadas."));
  }
  function toggleSymptom(symptom: string) { update({ symptoms: draft.symptoms.includes(symptom) ? draft.symptoms.filter((item) => item !== symptom) : [...draft.symptoms, symptom] }); }
  function go(next: Step) { setError(""); setStep(next); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function continueFlow() {
    if (step === 1 && (!draft.deviceType || !draft.deviceBrand || !draft.deviceModel || !draft.deviceColor || !draft.devicePhotos.length)) return setError("Preencha tipo, marca, modelo, cor e adicione pelo menos uma foto.");
    if (step === 1 && draft.problem.trim().length < 10) return setError("Conte um pouco mais sobre o problema (mínimo de 10 caracteres).");
    if (step === 2 && !draft.partnerId) return setError("Escolha uma assistência para receber a solicitação.");
    go((step + 1) as Step);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const deviceResponse = await fetch("/api/clients/devices", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo: draft.deviceType, marca: draft.deviceBrand, modelo: draft.deviceModel, fotoUrl: draft.devicePhotos[0], issueDescription: draft.problem }) });
      const deviceResult = await readApiResponse<{ device: { id: string } }>(deviceResponse);
      if (!deviceResponse.ok || !deviceResult.success) throw new Error(deviceResult.message || "Não foi possível registrar os dados do aparelho.");
      const orderPayload = { ...draft, deviceId: deviceResult.data.device.id, deviceDetails: { type: draft.deviceType, brand: draft.deviceBrand, model: draft.deviceModel, color: draft.deviceColor, photos: draft.devicePhotos } };
      const response = await fetch("/api/orders", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orderPayload) });
      const result = await readApiResponse<{ order: { id: string } }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível enviar a solicitação.");
      try { localStorage.removeItem(draftKey); } catch { /* Storage is optional. */ }
      setCreatedId(result.data.order.id);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Não foi possível enviar a solicitação."); }
    finally { setBusy(false); }
  }

  const selectedPartner = partners.find((item) => item.id === draft.partnerId);
  const selectedDevice = draft.deviceBrand && draft.deviceModel ? { marca: draft.deviceBrand, modelo: draft.deviceModel } : null;
  const brands = getDeviceBrands(draft.deviceType);
  const models = getDeviceModels(draft.deviceType, draft.deviceBrand);
  const visiblePartners = useMemo(() => [...partners].sort((a, b) => {
    if (partnerSort === "rating") return (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;
    if (partnerSort === "price") return (a.startingPriceCents ?? Number.MAX_SAFE_INTEGER) - (b.startingPriceCents ?? Number.MAX_SAFE_INTEGER);
    if (partnerSort === "time") return (a.fastestDays ?? Number.MAX_SAFE_INTEGER) - (b.fastestDays ?? Number.MAX_SAFE_INTEGER);
    return b.serviceCount - a.serviceCount || (b.rating ?? -1) - (a.rating ?? -1);
  }), [partnerSort, partners]);
  const selectedCategory = useMemo(() => PROBLEMS.find((item) => draft.symptoms.includes(item.symptom)), [draft.symptoms]);

  return <main className={styles.page}>
    <section className={styles.hero}><div><p>REPARO / NOVA SOLICITAÇÃO</p><h1>Vamos cuidar do seu aparelho</h1><span>Leva poucos minutos. Seu progresso fica salvo para continuar depois.</span></div></section>
    <div className={styles.content}>
      {createdId ? <section className={styles.success} role="status"><span aria-hidden="true">✓</span><h2>Solicitação enviada</h2><p>A assistência recebeu seu pedido. O próximo passo é a análise e o envio do orçamento.</p><div className={styles.nextStep}><strong>O que acontece agora?</strong><span>1. A assistência analisa o relato</span><span>2. Você recebe o diagnóstico e o orçamento</span><span>3. O reparo só começa após sua aprovação</span></div><div className={styles.actions}><Link href={`/cliente/ordens?q=${encodeURIComponent(createdId)}`} className={styles.primary}>Acompanhar reparo</Link><Link href="/cliente/dashboard" className={styles.secondary}>Voltar ao início</Link></div></section> : <>
        <nav className={styles.progress} aria-label="Progresso da solicitação">{["Aparelho e problema", "Assistência", "Revisão"].map((label, index) => { const number = index + 1; return <button type="button" key={label} className={number === step ? styles.progressActive : number < step ? styles.progressDone : ""} disabled={number > step} onClick={() => number < step && go(number as Step)}><span>{number < step ? "✓" : number}</span>{label}</button>; })}</nav>
        <div className={styles.stepMeta}><span>ETAPA {step} DE 3</span><small>Rascunho salvo automaticamente</small></div>
        {loading ? <div className={styles.panel} role="status">Preparando sua solicitação...</div> : error && !partners.length ? <div className={styles.error} role="alert">{error} <button type="button" onClick={retry}>Tentar novamente</button></div> : <form onSubmit={submit} className={styles.wizard}>
          {step === 1 && <section className={styles.panel}><div className={styles.sectionTitle}><span>01</span><div><h2>Informações do aparelho</h2><p>Esses dados ficarão vinculados somente a esta ordem de serviço.</p></div></div><div className={styles.deviceForm}><label>Tipo *<select value={draft.deviceType} onChange={(event) => update({ deviceType: event.target.value, deviceBrand: "", deviceModel: "" })} required><option value="">Selecione</option>{DEVICE_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label><label>Marca *<select value={draft.deviceBrand} onChange={(event) => update({ deviceBrand: event.target.value, deviceModel: "" })} disabled={!draft.deviceType} required><option value="">Selecione</option>{brands.map((brand) => <option key={brand}>{brand}</option>)}</select></label><label>Modelo *<select value={draft.deviceModel} onChange={(event) => update({ deviceModel: event.target.value })} disabled={!draft.deviceBrand} required><option value="">Selecione</option>{models.map((model) => <option key={model}>{model}</option>)}</select></label><label>Cor *<input value={draft.deviceColor} onChange={(event) => update({ deviceColor: event.target.value })} maxLength={80} placeholder="Ex.: preto" required /></label></div><label className={styles.photoPicker}>Fotos do aparelho *<span>Adicione até 3 fotos (JPG, PNG ou WebP, máximo 1,5 MB cada).</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectPhotos} /></label>{draft.devicePhotos.length > 0 && <div className={styles.photoGrid}>{draft.devicePhotos.map((photo, index) => <div key={index}><Image src={photo} alt={`Foto ${index + 1} do aparelho`} fill sizes="180px" unoptimized /></div>)}</div>}</section>}
          {step === 1 && <section className={styles.panel}><div className={styles.sectionTitle}><span>01</span><div><h2>Defeito e descrição do problema</h2><p>Escolha a opção mais próxima e conte o que aconteceu. Não é preciso conhecer termos técnicos.</p></div></div><div className={styles.problemGrid}>{PROBLEMS.map((item) => <button type="button" key={item.label} className={`${styles.problemCard} ${draft.symptoms.includes(item.symptom) ? styles.choiceSelected : ""}`} onClick={() => toggleSymptom(item.symptom)}><span>{item.icon}</span><strong>{item.label}</strong><small>{item.hint}</small></button>)}<button type="button" className={styles.problemCard} onClick={() => document.getElementById("problem-description")?.focus()}><span>＋</span><strong>Outro problema</strong><small>Descreva com suas próprias palavras.</small></button></div><label className={styles.descriptionLabel} htmlFor="problem-description">Descrição completa do defeito *<textarea id="problem-description" value={draft.problem} onChange={(event) => update({ problem: event.target.value })} placeholder="Ex.: começou ontem, o aparelho caiu e agora a tela acende, mas não responde ao toque." minLength={10} maxLength={3000} required /><small>Informe quando começou e o que você já tentou · {draft.problem.length}/3000</small></label><fieldset><legend>Como está o aparelho? <small>(opcional)</small></legend><div className={styles.checkGrid}>{CHECKLIST.map((item) => <label key={item} className={styles.check}><input type="checkbox" checked={draft.checklist.includes(item)} onChange={(event) => update({ checklist: event.target.checked ? [...draft.checklist, item] : draft.checklist.filter((value) => value !== item) })} />{item}</label>)}</div></fieldset></section>}
          {step === 2 && <section className={styles.panel}><div className={styles.sectionTitle}><span>02</span><div><h2>Escolha uma assistência</h2><p>Compare avaliações, preços iniciais e prazos antes de decidir.</p></div></div>{partners.length ? <><label className={styles.partnerSort}>Ordenar por<select value={partnerSort} onChange={(event) => setPartnerSort(event.target.value as typeof partnerSort)}><option value="recommended">Recomendadas</option><option value="rating">Melhor avaliação</option><option value="price">Menor preço inicial</option><option value="time">Menor prazo</option></select></label><div className={styles.partnerGrid}>{visiblePartners.map((partner) => <button type="button" key={partner.id} className={`${styles.partnerCard} ${draft.partnerId === partner.id ? styles.choiceSelected : ""}`} onClick={() => update({ partnerId: partner.id })}><span className={styles.monogram}>{partner.name.slice(0, 2).toUpperCase()}</span><span className={styles.partnerIdentity}><strong>{partner.name}</strong><small>✓ Assistência aprovada</small><span className={styles.partnerFacts}><em>{partner.rating === null ? "Nova na plataforma" : `★ ${partner.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} (${partner.reviewCount})`}</em><em>{partner.startingPriceCents === null ? "Consulte valores" : `A partir de ${(partner.startingPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`}</em><em>{partner.fastestDays === null ? `${partner.serviceCount} serviços` : `Prazo a partir de ${partner.fastestDays} ${partner.fastestDays === 1 ? "dia" : "dias"}`}</em></span></span><b>{draft.partnerId === partner.id ? "✓ Selecionada" : "Escolher"}</b></button>)}</div></> : <p>Nenhuma assistência disponível no momento.</p>}<div className={styles.finderCallout}><div><strong>Quer comparar também a distância?</strong><p>Use a busca no mapa para encontrar opções perto de você. Seu rascunho continuará salvo.</p></div><Link className={styles.secondary} href="/cliente/assistencias">Comparar no mapa →</Link></div></section>}
          {step === 3 && <section className={styles.panel}><div className={styles.sectionTitle}><span>03</span><div><h2>Revise antes de enviar</h2><p>O reparo não começa sem sua aprovação do orçamento.</p></div></div><div className={styles.reviewGrid}><article><small>APARELHO</small><strong>{selectedDevice ? `${selectedDevice.marca} ${selectedDevice.modelo}` : "Não selecionado"}</strong><p>{draft.deviceType} · Cor: {draft.deviceColor} · {draft.devicePhotos.length} {draft.devicePhotos.length === 1 ? "foto" : "fotos"}</p><button type="button" onClick={() => go(1)}>Alterar</button></article><article><small>PROBLEMA</small><strong>{selectedCategory?.label || "Descrição personalizada"}</strong><p>{draft.problem}</p><button type="button" onClick={() => go(1)}>Alterar</button></article><article><small>ASSISTÊNCIA</small><strong>{selectedPartner?.name || "Não selecionada"}</strong><button type="button" onClick={() => go(2)}>Alterar</button></article></div><div className={styles.safetyNote}><strong>Você mantém o controle</strong><p>A assistência enviará preço, prazo e garantia. Você poderá revisar tudo antes de agendar e pagar.</p></div></section>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.wizardActions}>{step > 1 ? <button type="button" className={styles.secondary} onClick={() => go((step - 1) as Step)}>← Voltar</button> : <Link href="/cliente/dashboard" className={styles.cancel}>Cancelar</Link>}{step < 3 ? <button type="button" className={styles.primary} onClick={continueFlow}>Continuar →</button> : <button type="submit" disabled={busy} className={styles.primary}>{busy ? "Enviando..." : "Enviar solicitação"}</button>}</div>
        </form>}
      </>}
    </div>
  </main>;
}
