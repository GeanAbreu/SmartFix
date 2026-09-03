"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import type { ApiResponse, ClientAddress } from "@/src/types/api";
import ConfirmDialog from "@/app/cliente/components/ConfirmDialog";
import styles from "./addresses.module.css";

type AddressForm = Omit<ClientAddress, "id">;
type AddressListData = { addresses: ClientAddress[] };

const emptyForm: AddressForm = {
  apelido: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  principal: false,
};

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload: unknown = await response.json();
  return payload as ApiResponse<T>;
}

async function fetchAddresses() {
  const response = await fetch("/api/clients/addresses", { cache: "no-store" });
  const result = await readResponse<AddressListData>(response);
  if (!result.success) throw new Error(result.message);
  return result.data.addresses;
}

export default function AddressManager() {
  const [addresses, setAddresses] = useState<ClientAddress[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cepStatus, setCepStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ClientAddress | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      setAddresses(await fetchAddresses());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os endereços.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchAddresses()
      .then((result) => { if (active) setAddresses(result); })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Não foi possível carregar os endereços.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, principal: addresses.length === 0 });
    setError("");
    setCepStatus("");
    setOpen(true);
  }

  function openEdit(address: ClientAddress) {
    setEditingId(address.id);
    setForm({
      apelido: address.apelido ?? "",
      cep: address.cep.replace(/(\d{5})(\d{3})/, "$1-$2"),
      logradouro: address.logradouro,
      numero: address.numero,
      complemento: address.complemento ?? "",
      bairro: address.bairro,
      cidade: address.cidade,
      estado: address.estado,
      principal: address.principal,
    });
    setError("");
    setCepStatus("");
    setOpen(true);
  }

  function closeModal() {
    if (!saving) setOpen(false);
  }

  function updateField<K extends keyof AddressForm>(field: K, value: AddressForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function lookupCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    updateField("cep", formatted);
    if (digits.length !== 8) { setCepStatus(""); return; }
    setCepStatus("Buscando CEP...");
    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json() as {
        erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string;
      };
      if (!response.ok || data.erro) throw new Error();
      setForm((current) => ({
        ...current,
        cep: formatted,
        logradouro: data.logradouro ?? "",
        bairro: data.bairro ?? "",
        cidade: data.localidade ?? "",
        estado: data.uf ?? "",
      }));
      setCepStatus("CEP encontrado");
    } catch {
      setCepStatus("CEP não encontrado; preencha o endereço manualmente.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/clients/addresses/${editingId}` : "/api/clients/addresses",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const result = await readResponse<{ address: ClientAddress }>(response);
      if (!result.success) throw new Error(result.message);
      setOpen(false);
      setMessage(result.message ?? "Endereço salvo com sucesso.");
      await loadAddresses();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o endereço.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(address: ClientAddress) {
    if (address.principal) {
      setError("Defina outro endereço como principal antes de excluir este endereço.");
      return;
    }

    setPendingDelete(address);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/clients/addresses/${pendingDelete.id}`, { method: "DELETE" });
      const result = await readResponse<Record<string, never>>(response);
      if (!result.success) throw new Error(result.message);
      setPendingDelete(null);
      setMessage(result.message ?? "Endereço excluído.");
      await loadAddresses();
    } catch (caught) {
      setPendingDelete(null);
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o endereço.");
    } finally {
      setDeleting(false);
    }
  }

  async function setPrimary(addressId: string) {
    setError("");
    const response = await fetch(`/api/clients/addresses/${addressId}/primary`, { method: "PATCH" });
    const result = await readResponse<{ address: ClientAddress }>(response);
    if (!result.success) { setError(result.message); return; }
    setMessage(result.message ?? "Endereço principal atualizado.");
    await loadAddresses();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/cliente/dashboard" className={styles.brand}>🔧 <strong>SMART<span>FIX</span></strong></Link>
        <nav aria-label="Navegação do cliente">
          <Link href="/cliente/dashboard">Início</Link>
          <Link href="/cliente/dispositivos">Dispositivos</Link>
          <Link href="/cliente/ajuda">Central de Ajuda</Link>
          <span>Endereços</span>
        </nav>
      </header>

      <section className={styles.hero}>
        <div><p>Meu Perfil / Endereços</p><h1>Meus Endereços</h1><span>Gerencie locais de coleta e entrega dos seus aparelhos.</span></div>
        <button type="button" onClick={openNew}>+ Novo endereço</button>
      </section>

      <section className={styles.content}>
        <div className={styles.heading}><div><h2>Endereços cadastrados</h2><p>Cadastre mais de um endereço e escolha o principal.</p></div></div>
        {message && <p className={styles.success} role="status">{message}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {loading ? <div className={styles.empty}>Carregando endereços...</div> : addresses.length === 0 ? (
          <div className={styles.empty}><strong>Nenhum endereço cadastrado</strong><p>Adicione um endereço para usar coleta e entrega.</p><button type="button" onClick={openNew}>Cadastrar endereço</button></div>
        ) : (
          <div className={styles.grid}>{addresses.map((address) => (
            <article key={address.id} className={`${styles.card} ${address.principal ? styles.primary : ""}`}>
              <div className={styles.cardTitle}><span>📍</span><div><h3>{address.apelido || "Endereço"}</h3>{address.principal && <small>Principal</small>}</div></div>
              <p><strong>{address.logradouro}, {address.numero}</strong>{address.complemento ? ` — ${address.complemento}` : ""}</p>
              <p>{address.bairro} · {address.cidade}/{address.estado}</p>
              <p>CEP {address.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
              <div className={styles.actions}>
                <button type="button" onClick={() => openEdit(address)}>Editar</button>
                {!address.principal && <button type="button" onClick={() => void setPrimary(address.id)}>Tornar principal</button>}
                <button
                  type="button"
                  className={styles.delete}
                  disabled={address.principal}
                  title={address.principal ? "Defina outro endereço como principal antes de excluir este." : undefined}
                  onClick={() => requestDelete(address)}
                >
                  {address.principal ? "Principal não pode ser excluído" : "Excluir"}
                </button>
              </div>
            </article>
          ))}</div>
        )}
      </section>

      {open && <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="address-title">
        <button className={styles.overlay} type="button" aria-label="Fechar" onClick={closeModal} />
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.formHeader}><div><small>RF03</small><h2 id="address-title">{editingId ? "Editar endereço" : "Adicionar endereço"}</h2></div><button type="button" onClick={closeModal} aria-label="Fechar">×</button></div>
          <div className={styles.formGrid}>
            <label>Identificação *<input value={form.apelido ?? ""} onChange={(e) => updateField("apelido", e.target.value)} placeholder="Casa, Trabalho..." required /></label>
            <label>CEP *<input value={form.cep} onChange={(e) => void lookupCep(e.target.value)} inputMode="numeric" maxLength={9} required /><small>{cepStatus}</small></label>
            <label className={styles.wide}>Logradouro *<input value={form.logradouro} onChange={(e) => updateField("logradouro", e.target.value)} required /></label>
            <label>Número *<input value={form.numero} onChange={(e) => updateField("numero", e.target.value)} required /></label>
            <label>Complemento<input value={form.complemento ?? ""} onChange={(e) => updateField("complemento", e.target.value)} /></label>
            <label>Bairro *<input value={form.bairro} onChange={(e) => updateField("bairro", e.target.value)} required /></label>
            <label>Cidade *<input value={form.cidade} onChange={(e) => updateField("cidade", e.target.value)} required /></label>
            <label>UF *<input value={form.estado} onChange={(e) => updateField("estado", e.target.value.toUpperCase())} maxLength={2} required /></label>
          </div>
          <label className={styles.checkbox}><input type="checkbox" checked={form.principal} onChange={(e) => updateField("principal", e.target.checked)} /> Definir como endereço principal</label>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.formActions}><button type="button" onClick={closeModal}>Cancelar</button><button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar endereço"}</button></div>
        </form>
      </div>}
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir endereço?"
        message={`O endereço “${pendingDelete?.apelido ?? "Sem nome"}” será removido permanentemente.`}
        confirmLabel="Excluir endereço"
        busy={deleting}
        onCancel={() => { if (!deleting) setPendingDelete(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
