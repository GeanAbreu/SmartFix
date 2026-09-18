"use client";

import { useEffect, useState, type FormEvent } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./services.module.css";

type Service = { id: string; name: string; description: string; unitPriceCents: number; estimatedDays: number; isActive: boolean };
type ServiceData = { services: Service[] };
const money = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function servicesRequest(url: string, method = "GET", body?: unknown) {
  const response = await fetch(url, { method, credentials: "include", cache: "no-store",
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const result = await readApiResponse<ServiceData>(response);
  if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível salvar o serviço.");
  return result.data.services;
}

export default function PartnerServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void servicesRequest("/api/services")
      .then((items) => { if (active) setServices(items); })
      .catch((cause: Error) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusyId(editing?.id || "new"); setError(""); setMessage("");
    try {
      const body = { name: String(data.get("name") || "").trim(), description: String(data.get("description") || "").trim(),
        unitPriceCents: Math.round(Number(data.get("price")) * 100), estimatedDays: Number(data.get("days")),
        isActive: editing?.isActive ?? true };
      const items = await servicesRequest(editing ? `/api/services/${encodeURIComponent(editing.id)}` : "/api/services", editing ? "PATCH" : "POST", body);
      setServices(items); setFormOpen(false); setEditing(null); setMessage(editing ? "Serviço atualizado." : "Serviço adicionado.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar o serviço."); }
    finally { setBusyId(""); }
  }

  async function toggle(service: Service) {
    setBusyId(service.id); setError(""); setMessage("");
    try {
      setServices(await servicesRequest(`/api/services/${encodeURIComponent(service.id)}`, "PATCH", { isActive: !service.isActive }));
      setMessage(service.isActive ? "Serviço ocultado dos clientes." : "Serviço visível para os clientes.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o serviço."); }
    finally { setBusyId(""); }
  }

  const activeCount = services.filter((service) => service.isActive).length;
  return <main className={styles.page}><div className={styles.inner}>
    <header className={styles.header}><div><span className={styles.eyebrow}>ÁREA DO PARCEIRO</span><h1>Serviços oferecidos</h1><p>Cadastre o que sua assistência realiza. Serviços ativos aparecem no seu perfil para os clientes.</p></div><button className={styles.primaryButton} type="button" onClick={() => { setEditing(null); setFormOpen(true); setError(""); }}>+ Adicionar serviço</button></header>
    <section className={styles.summary} aria-label="Resumo dos serviços"><div><span>Serviços cadastrados</span><strong>{loading ? "—" : services.length}</strong></div><div><span>Visíveis para clientes</span><strong>{loading ? "—" : activeCount}</strong></div></section>
    {error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.message} role="status">{message}</p>}
    {formOpen && <section className={styles.formPanel} aria-labelledby="service-form-title"><div className={styles.panelHead}><div><span className={styles.eyebrow}>CATÁLOGO</span><h2 id="service-form-title">{editing ? "Editar serviço" : "Novo serviço"}</h2></div><button type="button" className={styles.closeButton} onClick={() => { setFormOpen(false); setEditing(null); }} aria-label="Fechar formulário">×</button></div>
      <form key={editing?.id || "new"} onSubmit={(event) => void save(event)}><label>Nome do serviço<input name="name" maxLength={150} defaultValue={editing?.name || ""} placeholder="Ex.: Troca de tela" required /></label><label>Descrição<textarea name="description" maxLength={2000} defaultValue={editing?.description || ""} placeholder="Explique o que está incluído no serviço" /></label><div className={styles.formGrid}><label>Preço base (R$)<input name="price" type="number" min={0} max={100000} step="0.01" defaultValue={editing ? (editing.unitPriceCents / 100).toFixed(2) : ""} required /></label><label>Prazo estimado (dias)<input name="days" type="number" min={0} max={365} defaultValue={editing?.estimatedDays ?? ""} required /></label></div><p className={styles.formHint}>O preço é uma referência. O orçamento final é enviado na ordem de serviço.</p><div className={styles.formActions}><button type="button" className={styles.secondaryButton} onClick={() => { setFormOpen(false); setEditing(null); }}>Cancelar</button><button type="submit" className={styles.primaryButton} disabled={!!busyId}>{busyId ? "Salvando..." : "Salvar serviço"}</button></div></form>
    </section>}
    <section className={styles.catalog} aria-labelledby="catalog-title"><div className={styles.catalogHead}><div><span className={styles.eyebrow}>CATÁLOGO</span><h2 id="catalog-title">Seus serviços</h2></div><span>{loading ? "Carregando..." : `${services.length} ${services.length === 1 ? "serviço" : "serviços"}`}</span></div>
      {loading ? <p className={styles.empty} role="status">Carregando serviços...</p> : services.length === 0 ? <div className={styles.empty}><span aria-hidden="true">▣</span><h3>Seu catálogo começa aqui</h3><p>Adicione seu primeiro serviço para mostrar aos clientes o que sua assistência oferece.</p><button className={styles.primaryButton} type="button" onClick={() => setFormOpen(true)}>Adicionar serviço</button></div>
        : <div className={styles.cards}>{services.map((service) => <article key={service.id} className={styles.card}><div className={styles.cardTop}><span className={styles.serviceIcon} aria-hidden="true">⚙</span><span className={service.isActive ? styles.activeBadge : styles.inactiveBadge}>{service.isActive ? "Visível" : "Oculto"}</span></div><h3>{service.name}</h3><p>{service.description || "Sem descrição."}</p><div className={styles.facts}><div><span>Preço base</span><strong>{money(service.unitPriceCents)}</strong></div><div><span>Prazo estimado</span><strong>{service.estimatedDays} {service.estimatedDays === 1 ? "dia" : "dias"}</strong></div></div><div className={styles.cardActions}><button type="button" onClick={() => { setEditing(service); setFormOpen(true); setError(""); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</button><button type="button" disabled={busyId === service.id} onClick={() => void toggle(service)}>{busyId === service.id ? "Atualizando..." : service.isActive ? "Ocultar" : "Mostrar"}</button></div></article>)}</div>}
    </section>
  </div></main>;
}
