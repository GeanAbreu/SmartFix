"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import styles from "./prototype-integration.module.css";

export default function TrackingCode({ orderId, device }: { orderId: string; device: string }) {
  const [image, setImage] = useState("");
  const [copied, setCopied] = useState(false);
  const path = `/cliente/ordens?q=${encodeURIComponent(orderId)}`;
  useEffect(() => {
    void QRCode.toDataURL(`${window.location.origin}${path}`, { width: 180, margin: 1,
      color: { dark: "#07111f", light: "#ffffff" }, errorCorrectionLevel: "H" }).then(setImage);
  }, [path]);
  async function copy() { await navigator.clipboard.writeText(`${window.location.origin}${path}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <section className={styles.tracking}><div>{image && <Image src={image} alt={`QR Code para acompanhar ${device}`} width={144} height={144} unoptimized />}</div><div><span className={styles.eyebrow}>ACOMPANHAMENTO</span><h4>QR Code da O.S.</h4><p>Abra esta ordem rapidamente em outro dispositivo.</p><button type="button" onClick={() => void copy()}>{copied ? "Link copiado" : "Copiar link"}</button><button type="button" onClick={() => window.print()}>Imprimir</button></div></section>;
}
