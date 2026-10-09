"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./prototype-integration.module.css";

export default function TrackingCode({ orderId, device }: { orderId: string; device: string }) {
  const [image, setImage] = useState("");
  const [copied, setCopied] = useState(false);
  const [path, setPath] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch(`/api/orders/${encodeURIComponent(orderId)}/tracking-link`, {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}",
    }).then(async (response) => {
      const result = await readApiResponse<{ path: string }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível criar o link público.");
      if (!active) return;
      setPath(result.data.path);
      return QRCode.toDataURL(`${window.location.origin}${result.data.path}`, { width: 180, margin: 1,
        color: { dark: "#07111f", light: "#ffffff" }, errorCorrectionLevel: "H" });
    }).then((value) => { if (active && value) setImage(value); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível criar o link público."); });
    return () => { active = false; };
  }, [orderId]);
  async function copy() { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <section className={styles.tracking}><div>{image && <Image src={image} alt={`QR Code para acompanhar ${device}`} width={144} height={144} unoptimized />}</div><div><span className={styles.eyebrow}>ACOMPANHAMENTO PÚBLICO</span><h4>QR Code da O.S.</h4><p>Quem receber este link poderá ver somente o andamento e o histórico, sem fazer login.</p>{error ? <p role="alert">{error}</p> : <><button type="button" disabled={!path} onClick={() => void copy()}>{copied ? "Link copiado" : path ? "Copiar link seguro" : "Gerando link…"}</button>{path && <a href={path} target="_blank" rel="noreferrer">Abrir link</a>}</>}</div></section>;
}
