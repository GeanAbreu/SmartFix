"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/components/RepairWorkspace";
import type { ClientAddress, ClientDevice } from "@/src/types/api";
import type { DiscoveryResult, GeoPoint, NearbyPartner } from "@/src/types/discovery";
import styles from "./assistencias.module.css";
const AssistanceMap = dynamic(() => import("./AssistanceMap"), { ssr: false, loading: () => <p className={styles.empty}>Carregando mapa…</p> });
const SEARCH_KEY = "smartfix-assistance-search";
type Origin = { addressId: string } | { origin: GeoPoint };
type PublicReview = { id: string; rating: number; comment: string; review_date: string };
type OfferedService = { id: string; name: string; description: string; unitPriceCents: number; estimatedDays: number };
const distance = (km: number) => km < .1 ? "Menos de 100 m" : `${km.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
function Rating({ partner }: { partner: NearbyPartner }) {
  return <span className={styles.rating}>{partner.rating === null ? "Sem avaliações" : <>★ {partner.rating.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <small>({partner.reviewCount} {partner.reviewCount === 1 ? "avaliação" : "avaliações"})</small></>}</span>;
}
export default function AssistanceFinder({ deviceId, partnerId, accountId }: { deviceId: string; partnerId: string; accountId: string }) {
  const searchKey = `${SEARCH_KEY}:${accountId}`;
  const router = useRouter();
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState(deviceId);
  const [source, setSource] = useState<Origin | null>(null);
  const [radius, setRadius] = useState(10);
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState<GeoPoint[]>([]);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("both");
  const [selectedId, setSelectedId] = useState(partnerId);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [reviewError, setReviewError] = useState("");
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [services, setServices] = useState<OfferedService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(Boolean(partnerId));
  const [servicesError, setServicesError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const generation = useRef(0);
  const selected = result?.partners.find((p) => p.id === selectedId);

  const search = useCallback(async (origin: Origin, range: number) => {
    const current = ++generation.current;
    setSource(origin); setRadius(range); setLoading(true); setError(""); setResult(null); setLocations([]);
    try {
      const data = await api<DiscoveryResult>("/api/partners/nearby", { ...origin, radius: range });
      if (current !== generation.current) return;
      setResult(data);
      try { sessionStorage.setItem(searchKey, JSON.stringify({ origin, radius: range })); } catch { /* Storage can be disabled. */ }
    } catch (caught) { if (current === generation.current) setError((caught as Error).message); }
    finally { if (current === generation.current) setLoading(false); }
  }, [searchKey]);
  useEffect(() => {
    let active = true;
    void Promise.all([api<{ addresses: ClientAddress[] }>("/api/clients/addresses"), api<{ devices: ClientDevice[] }>("/api/clients/devices")])
      .then(([a, d]) => {
        if (!active) return;
        setAddresses(a.addresses); setDevices(d.devices);
        setSelectedDevice(d.devices.some((v) => v.id === deviceId) ? deviceId : d.devices[0]?.id || "");
        // A return from device registration keeps the chosen search region.
        if (partnerId) {
          try { const saved = JSON.parse(sessionStorage.getItem(searchKey) || "null");
            if (saved?.origin && [5, 10, 25, 50, 100].includes(saved.radius)) { void search(saved.origin, saved.radius); return; }
          } catch { /* Fall back to the main address. */ }
        }
        const main = a.addresses.find((item) => item.principal) || a.addresses[0];
        if (main) void search({ addressId: main.id }, 10); else setLoading(false);
      }).catch((caught: Error) => { if (active) { setError(caught.message); setLoading(false); } });
    return () => { active = false; };
  }, [deviceId, partnerId, search, searchKey]);
  useEffect(() => {
    if (selected) dialog.current?.showModal(); else dialog.current?.close();
  }, [selected]);
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void api<{ reviews: PublicReview[] }>(`/api/partners/${encodeURIComponent(selectedId)}/reviews`)
      .then((data) => { if (active) setReviews(data.reviews); })
      .catch((caught: Error) => { if (active) setReviewError(caught.message); })
      .finally(() => { if (active) setReviewsLoading(false); });
    return () => { active = false; };
  }, [selectedId]);
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    void api<{ services: OfferedService[] }>(`/api/partners/${encodeURIComponent(selectedId)}/services`)
      .then((data) => { if (active) setServices(data.services); })
      .catch((caught: Error) => { if (active) setServicesError(caught.message); })
      .finally(() => { if (active) setServicesLoading(false); });
    return () => { active = false; };
  }, [selectedId]);
  const openProfile = useCallback((id: string) => { setReviews([]); setReviewError(""); setReviewsLoading(true); setServices([]); setServicesError(""); setServicesLoading(true); setSelectedId(id); }, []);
  async function lookup(event: FormEvent) {
    event.preventDefault(); setLocating(true); setError(""); setLocations([]);
    try {
      const data = await api<{ locations: GeoPoint[] }>("/api/locations", { query });
      if (!data.locations.length) setError("Localização não encontrada. Confira o CEP ou informe cidade e estado.");
      else setLocations(data.locations);
    } catch (caught) { setError((caught as Error).message); }
    finally { setLocating(false); }
  }
  function gps() {
    if (!navigator.geolocation) { setError("Seu navegador não oferece localização. Use um endereço, CEP ou cidade."); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition((position) => {
      setLocating(false);
      void search({ origin: { lat: position.coords.latitude, lng: position.coords.longitude, label: "Minha localização atual", precision: "gps" } }, radius);
    }, () => { setLocating(false); setError("Não foi possível acessar sua localização. Permita o acesso no navegador ou use CEP/cidade."); },
    { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false });
  }
  return <main className={styles.page}>
    <section className={styles.hero}><div><p className={styles.eyebrow}>PERTO DE VOCÊ</p><h1>O cuidado certo.<br /><span>Mais perto do que imagina.</span></h1>
      <p>Encontre uma assistência aprovada e dê o próximo passo no reparo do seu aparelho.</p></div><div className={styles.heroSeal} aria-hidden="true">⌖</div></section>
    <div className={styles.content}>
      <section className={styles.searchPanel} aria-label="Localização da busca">
        <div className={styles.locationRow}><div><p className={styles.eyebrow}>BUSCAR PERTO DE</p><strong>{result?.origin.label || "Escolha sua localização"}</strong></div>
          <button className={styles.secondary} onClick={gps} disabled={locating || loading}>⌖ {locating ? "Localizando…" : "Usar minha localização"}</button></div>
        <div className={styles.searchGrid}><label>Endereço cadastrado<select value={source && "addressId" in source ? source.addressId : ""} disabled={loading || locating}
          onChange={(e) => { if (e.target.value) void search({ addressId: e.target.value }, radius); }}><option value="">Selecione um endereço</option>
          {addresses.map((a) => <option value={a.id} key={a.id}>{a.apelido || a.logradouro} · {a.cidade}{a.principal ? " (principal)" : ""}</option>)}</select></label>
          <form onSubmit={lookup}><label htmlFor="location-query">Ou informe CEP / cidade e estado</label><div className={styles.inline}><input id="location-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: 01001-000 ou São Paulo, SP" minLength={3} maxLength={120} required /><button disabled={locating || loading} className={styles.primary}>Buscar</button></div></form>
          <label>Raio da busca<select value={radius} disabled={loading || locating} onChange={(e) => { const r = Number(e.target.value); if (source) void search(source, r); else setRadius(r); }}>{[5, 10, 25, 50, 100].map((n) => <option key={n} value={n}>Até {n} km</option>)}</select></label></div>
        {!!locations.length && <div className={styles.choices} aria-label="Localizações encontradas"><p>Confirme onde deseja buscar:</p>{locations.map((location) => <button className={styles.secondary} key={`${location.lat}:${location.lng}`} onClick={() => void search({ origin: location }, radius)}>{location.label} →</button>)}</div>}
        <p className={styles.hint}>Distâncias em linha reta, aproximadas pelo CEP das assistências.{result?.origin.precision === "city" && " A busca parte do centro da cidade selecionada."} <Link href="/cliente/enderecos">Gerenciar endereços</Link></p>
      </section>
      {error && <div role="alert" className={styles.error}>{error} {source && <button className={styles.secondary} onClick={() => void search(source, radius)}>Tentar novamente</button>}</div>}
      <div className={styles.resultsHeading}><div><h2>Assistências na sua região</h2><p role="status">{loading ? "Buscando assistências…" : result ? `${result.partners.length} ${result.partners.length === 1 ? "assistência encontrada" : "assistências encontradas"} em até ${radius} km · Mais próximas primeiro` : "Informe uma localização para começar."}</p></div>
        <div className={styles.segment} aria-label="Visualização">{[["list", "Lista"], ["both", "Lista e mapa"], ["map", "Mapa"]].map(([value, label]) => <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div></div>
      {loading ? <div className={styles.skeleton} aria-label="Carregando assistências"><div /><div /><div /></div> : result ? <>
        {result.unavailableLocations > 0 && <p className={styles.notice}>Algumas assistências aprovadas estão sem localização disponível e não aparecem nesta busca.</p>}
        {!result.partners.length && <section className={styles.empty}><span aria-hidden="true">⌖</span><h3>Nenhuma assistência neste raio</h3><p>Tente ampliar a distância ou escolher outra localização.</p>{radius < 100 && <button className={styles.primary} onClick={() => source && void search(source, radius < 25 ? 25 : radius < 50 ? 50 : 100)}>Ampliar para {radius < 25 ? 25 : radius < 50 ? 50 : 100} km</button>}</section>}
        <div className={view === "both" ? styles.split : styles.single}>
          {view !== "map" && <div className={styles.cards}>{result.partners.map((partner, index) => <article className={styles.card} key={partner.id}>
            <div className={styles.cardTop}><span className={styles.monogram}>{partner.name.slice(0, 2).toUpperCase()}</span><span className={styles.approved}>✓ Parceiro aprovado</span><span className={styles.number}>{index + 1}</span></div>
            <h3>{partner.name}</h3><Rating partner={partner} /><p className={styles.address}>{partner.address}</p><div className={styles.cardBottom}><div><strong>⌖ {distance(partner.distanceKm)}</strong><small>distância aproximada</small></div><button className={styles.secondary} onClick={() => openProfile(partner.id)}>Ver assistência →</button></div></article>)}</div>}
          {view !== "list" && <AssistanceMap origin={result.origin} partners={result.partners} radius={radius} onSelect={openProfile} />}
        </div></> : !error && <div className={styles.empty}><h3>Sua próxima assistência começa aqui</h3><p>Use sua localização, um endereço cadastrado ou busque por CEP e cidade.</p></div>}
      <p className={styles.attribution}>Localização: BrasilAPI e <a href="https://photon.komoot.io" target="_blank" rel="noreferrer">Photon</a> · Mapas e dados © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a></p>
    </div>
    <dialog ref={dialog} className={styles.dialog} onCancel={() => setSelectedId("")} onClose={() => setSelectedId("")} aria-labelledby="partner-title">
      {selected && <><div className={styles.dialogTop}><span className={styles.approved}>✓ Parceiro aprovado</span><button className={styles.secondary} onClick={() => setSelectedId("")} aria-label="Fechar perfil">✕</button></div>
        <h2 id="partner-title">{selected.name}</h2><Rating partner={selected} /><p className={styles.address}>{selected.address}</p><p>⌖ {distance(selected.distanceKm)} · distância aproximada pelo CEP</p>
        <section className={styles.offeredServices}><h3>Serviços oferecidos</h3>
          {servicesLoading ? <p role="status">Carregando serviços…</p> : servicesError ? <p role="alert">{servicesError}</p> : services.length === 0 ? <p>Esta assistência ainda não informou serviços.</p> :
            <ul>{services.map((service) => <li key={service.id}><div><strong>{service.name}</strong>{service.description && <p>{service.description}</p>}<small>Prazo estimado: {service.estimatedDays} {service.estimatedDays === 1 ? "dia" : "dias"}</small></div><span>A partir de {(service.unitPriceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span></li>)}</ul>}
        </section>
        <section className={styles.requestBox}><h3>Vamos cuidar do seu aparelho?</h3>{devices.length ? <><label>Aparelho para reparo<select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)}>{devices.map((d) => <option key={d.id} value={d.id}>{d.apelido || `${d.marca} ${d.modelo}`}</option>)}</select></label>
          <button className={styles.primary} disabled={!selectedDevice} onClick={() => router.push(`/cliente/solicitar-reparo?partnerId=${selected.id}&deviceId=${encodeURIComponent(selectedDevice)}`)}>Solicitar reparo →</button></> : <><p>Cadastre um aparelho para solicitar um reparo. Depois, você volta para esta assistência.</p><Link className={styles.primary} href={`/cliente/dispositivos?partnerId=${selected.id}`}>Cadastrar novo dispositivo →</Link></>}</section>
        <h3>Avaliações de clientes</h3><p className={styles.hint}>Até 10 avaliações mais recentes de reparos concluídos.</p>
        {reviewsLoading ? <p role="status">Carregando avaliações…</p> : reviewError ? <p role="alert">{reviewError}</p> : !reviews.length ? <p className={styles.hint}>Esta assistência ainda não recebeu avaliações.</p> : reviews.map((review) => <article className={styles.review} key={review.id}><strong>★ {review.rating}/5</strong><time dateTime={review.review_date}>{new Date(`${review.review_date}T12:00:00`).toLocaleDateString("pt-BR")}</time><p>{review.comment || "Avaliação sem comentário."}</p></article>)}
      </>}
    </dialog>
  </main>;
}
