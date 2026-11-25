"use client";

import Image from "next/image";
import { useState, type ChangeEvent, type FormEvent } from "react";
import styles from "./warranty-claim-modal.module.css";

type Props = {
  open: boolean;
  busy: boolean;
  orderLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string, photos: string[]) => Promise<void>;
};

const MAX_PHOTOS = 5;
const MAX_BYTES = 2 * 1024 * 1024;

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler uma das fotos."));
    reader.readAsDataURL(file);
  });
}

export default function WarrantyClaimModal({ open, busy, orderLabel, onCancel, onConfirm }: Props) {
  const [reason, setReason] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  if (!open) return null;

  async function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (photos.length + files.length > MAX_PHOTOS) return setError(`Envie no máximo ${MAX_PHOTOS} fotos.`);
    if (files.some((file) => !file.type.startsWith("image/") || file.size > MAX_BYTES))
      return setError("Use imagens JPG, PNG ou WebP de até 2 MB cada.");
    try { const loaded = await Promise.all(files.map(readImage)); setPhotos((current) => [...current, ...loaded]); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível ler as fotos."); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason.trim().length < 10) return setError("Descreva o problema com pelo menos 10 caracteres.");
    if (photos.length === 0) return setError("Adicione ao menos uma foto do aparelho.");
    await onConfirm(reason.trim(), photos);
  }

  return <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="warranty-title">
      <span className={styles.eyebrow}>O.S. {orderLabel}</span><h2 id="warranty-title">Acionar garantia</h2>
      <p>Explique o defeito recorrente e anexe fotos atuais. A assistência responsável receberá a solicitação.</p>
      <form onSubmit={(event) => void submit(event)}>
        <label>Motivo do acionamento da garantia<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={2000} required rows={5} placeholder="Descreva quando o problema voltou e como ele se manifesta." /></label>
        <label>Fotos do aparelho<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => void selectPhotos(event)} disabled={busy || photos.length >= MAX_PHOTOS} /><small>Até {MAX_PHOTOS} fotos, com no máximo 2 MB cada.</small></label>
        {photos.length > 0 && <div className={styles.previews}>{photos.map((photo, index) => <div key={`${photo.slice(-24)}-${index}`}><Image src={photo} alt={`Prévia da foto ${index + 1}`} fill unoptimized sizes="120px" /><button type="button" aria-label={`Remover foto ${index + 1}`} onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}</div>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}><button type="button" onClick={onCancel} disabled={busy}>Cancelar</button><button type="submit" disabled={busy}>{busy ? "Enviando…" : "Confirmar acionamento"}</button></div>
      </form>
    </section>
  </div>;
}
