"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
import ConfirmDialog from "@/app/cliente/components/ConfirmDialog";
import { DEVICE_TYPES, getDeviceBrands, getDeviceModels } from "@/src/constants/device-catalog";
import type { ApiResponse, ClientDevice } from "@/src/types/api";
import styles from "./devices.module.css";

type DeviceForm = Omit<ClientDevice, "id">;
type DeviceListData = { devices: ClientDevice[] };

const MAX_PHOTO_BYTES = 1_500_000;
const SUPPORTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const emptyForm: DeviceForm = { tipo: "", marca: "", modelo: "", fotoUrl: "" };

async function readResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const payload: unknown = await response.json();
  return payload as ApiResponse<T>;
}

async function fetchDevices() {
  const response = await fetch("/api/clients/devices", { cache: "no-store" });
  const result = await readResponse<DeviceListData>(response);
  if (!result.success) throw new Error(result.message);
  return result.data.devices;
}

export default function DeviceManager() {
  const [devices, setDevices] = useState<ClientDevice[]>([]);
  const [form, setForm] = useState<DeviceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ClientDevice | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const brands = getDeviceBrands(form.tipo);
  const models = getDeviceModels(form.tipo, form.marca);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      setDevices(await fetchDevices());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível carregar os dispositivos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchDevices()
      .then((result) => { if (active) setDevices(result); })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : "Não foi possível carregar os dispositivos.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(device: ClientDevice) {
    setEditingId(device.id);
    setForm({ tipo: device.tipo, marca: device.marca, modelo: device.modelo, fotoUrl: device.fotoUrl });
    setError("");
    setOpen(true);
  }

  function closeModal() {
    if (!saving) setOpen(false);
  }

  function selectType(tipo: string) {
    setForm((current) => ({ ...current, tipo, marca: "", modelo: "" }));
  }

  function selectBrand(marca: string) {
    setForm((current) => ({ ...current, marca, modelo: "" }));
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_PHOTO_TYPES.includes(file.type)) {
      setError("Escolha uma imagem JPG, PNG ou WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_PHOTO_BYTES) {
      setError("A foto deve ter no máximo 1,5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({ ...current, fotoUrl: reader.result as string }));
        setError("");
      }
    };
    reader.onerror = () => setError("Não foi possível ler a foto selecionada.");
    reader.readAsDataURL(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/clients/devices/${editingId}` : "/api/clients/devices",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      const result = await readResponse<{ device: ClientDevice }>(response);
      if (!result.success) throw new Error(result.message);
      setOpen(false);
      setMessage(result.message ?? "Dispositivo salvo com sucesso.");
      await loadDevices();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar o dispositivo.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`/api/clients/devices/${pendingDelete.id}`, { method: "DELETE" });
      const result = await readResponse<Record<string, never>>(response);
      if (!result.success) throw new Error(result.message);
      setPendingDelete(null);
      setMessage(result.message ?? "Dispositivo excluído.");
      await loadDevices();
    } catch (caught) {
      setPendingDelete(null);
      setError(caught instanceof Error ? caught.message : "Não foi possível excluir o dispositivo.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/cliente/dashboard" className={styles.brand}>🔧 <strong>SMART<span>FIX</span></strong></Link>
        <nav aria-label="Navegação do cliente">
          <Link href="/cliente/dashboard">Início</Link>
          <span>Dispositivos</span>
          <Link href="/cliente/enderecos">Endereços</Link>
          <Link href="/cliente/ajuda">Central de Ajuda</Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div><p>Meu Perfil / Dispositivos</p><h1>Meus Dispositivos</h1><span>Cadastre os aparelhos que você deseja manter ou reparar.</span></div>
        <button type="button" onClick={openNew}>+ Novo dispositivo</button>
      </section>

      <section className={styles.content}>
        <div className={styles.heading}><div><h2>Dispositivos cadastrados</h2><p>Suas informações ficam prontas para futuras solicitações.</p></div><strong>{devices.length}</strong></div>
        {message && <p className={styles.success} role="status">{message}</p>}
        {error && !open && <p className={styles.error} role="alert">{error}</p>}

        {loading ? <div className={styles.empty}>Carregando dispositivos...</div> : devices.length === 0 ? (
          <div className={styles.empty}><span>⌁</span><strong>Nenhum dispositivo cadastrado</strong><p>Adicione seu primeiro aparelho para começar.</p><button type="button" onClick={openNew}>Cadastrar dispositivo</button></div>
        ) : (
          <div className={styles.grid}>{devices.map((device) => (
            <article key={device.id} className={styles.card}>
              <div className={styles.photo}>
                <Image src={device.fotoUrl} alt={`${device.marca} ${device.modelo}`} fill sizes="(max-width: 700px) 100vw, 360px" unoptimized />
                <small>{device.tipo}</small>
              </div>
              <div className={styles.cardBody}>
                <p>{device.marca}</p>
                <h3>{device.modelo}</h3>
                <div className={styles.actions}>
                  <button type="button" onClick={() => openEdit(device)}>Editar</button>
                  <button type="button" className={styles.delete} onClick={() => setPendingDelete(device)}>Excluir</button>
                </div>
              </div>
            </article>
          ))}</div>
        )}
      </section>

      {open && <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="device-title">
        <button className={styles.overlay} type="button" aria-label="Fechar" onClick={closeModal} />
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.formHeader}><div><small>MEU APARELHO</small><h2 id="device-title">{editingId ? "Editar dispositivo" : "Adicionar dispositivo"}</h2></div><button type="button" onClick={closeModal} aria-label="Fechar">×</button></div>
          <div className={styles.formGrid}>
            <label>Tipo de dispositivo *<select value={form.tipo} onChange={(event) => selectType(event.target.value)} required><option value="">Selecione o tipo</option>{DEVICE_TYPES.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}</select></label>
            <label>Marca *<select value={form.marca} onChange={(event) => selectBrand(event.target.value)} disabled={!form.tipo} required><option value="">Selecione a marca</option>{brands.map((marca) => <option key={marca} value={marca}>{marca}</option>)}</select></label>
            <label className={styles.wide}>Modelo *<select value={form.modelo} onChange={(event) => setForm((current) => ({ ...current, modelo: event.target.value }))} disabled={!form.marca} required><option value="">Selecione o modelo</option>{models.map((modelo) => <option key={modelo} value={modelo}>{modelo}</option>)}</select></label>
          </div>
          <label className={styles.photoPicker}>
            <span>{form.fotoUrl ? "Trocar foto" : "Adicionar foto"}</span>
            <small>JPG, PNG ou WebP · máximo 1,5 MB</small>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} />
          </label>
          {form.fotoUrl && <div className={styles.preview}><Image src={form.fotoUrl} alt="Pré-visualização do dispositivo" fill sizes="600px" unoptimized /></div>}
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.formActions}><button type="button" onClick={closeModal}>Cancelar</button><button type="submit" disabled={saving || !form.fotoUrl}>{saving ? "Salvando..." : "Salvar dispositivo"}</button></div>
        </form>
      </div>}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir dispositivo?"
        message={`${pendingDelete?.marca ?? "Este dispositivo"} ${pendingDelete?.modelo ?? ""} será removido permanentemente.`}
        confirmLabel="Excluir dispositivo"
        busy={deleting}
        onCancel={() => { if (!deleting) setPendingDelete(null); }}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
