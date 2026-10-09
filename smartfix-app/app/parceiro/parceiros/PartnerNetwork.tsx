"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./partners.module.css";

type Partner = { id: string; name: string };

export default function PartnerNetwork() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/partners", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ partners: Partner[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar a rede.");
      setPartners(result.data.partners);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível carregar a rede."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void fetch("/api/partners", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<{ partners: Partner[] }>(response);
        if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar a rede.");
        if (active) setPartners(result.data.partners);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a rede."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => partners.filter((partner) => partner.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"))), [partners, query]);
  return <main className={styles.page}><div className={styles.container}>
    <header className={styles.header}><div><span>REDE SMARTFIX</span><h1>Parceiros cadastrados</h1><p>Conheça as assistências aprovadas que fazem parte da rede.</p></div><div className={styles.counter}><strong>{partners.length}</strong><span>parceiro{partners.length === 1 ? "" : "s"} ativo{partners.length === 1 ? "" : "s"}</span></div></header>
    <div className={styles.toolbar}><label><span>Buscar assistência</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Digite o nome do parceiro" /></label><button onClick={() => void load()} disabled={loading}>{loading ? "Atualizando…" : "Atualizar rede"}</button></div>
    {error && <div className={styles.error} role="alert">{error} <button onClick={() => void load()}>Tentar novamente</button></div>}
    {loading ? <p className={styles.empty}>Carregando parceiros…</p> : visible.length === 0 ? <p className={styles.empty}>{query ? "Nenhum parceiro corresponde à busca." : "Ainda não há parceiros aprovados na rede."}</p> : <section className={styles.grid} aria-label="Parceiros aprovados">{visible.map((partner) => <article key={partner.id}><div className={styles.avatar}>{partner.name.slice(0, 2).toUpperCase()}</div><div><h2>{partner.name}</h2><span><i /> Parceiro verificado</span><small>ID {partner.id.slice(0, 8).toUpperCase()}</small></div></article>)}</section>}
    <aside className={styles.notice}><strong>Privacidade da rede</strong><p>Dados de contato e informações financeiras de outras assistências não são exibidos. Conversas com clientes ficam disponíveis somente quando existe vínculo por ordem de serviço.</p></aside>
  </div></main>;
}
