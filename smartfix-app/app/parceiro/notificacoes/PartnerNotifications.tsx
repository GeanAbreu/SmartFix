"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./notifications.module.css";

type Notification = { id: string; data: { message: string; href: string; read: boolean; createdAt: string } };

function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></svg>;
}

export default function PartnerNotifications({ audience = "partner" }: { audience?: "partner" | "client" }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const unread = useMemo(() => notifications.filter((item) => !item.data.read).length, [notifications]);

  async function load() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<{ notifications: Notification[] }>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as notificações.");
      setNotifications(result.data.notifications);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar as notificações."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<{ notifications: Notification[] }>(response);
        if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as notificações.");
        if (active) setNotifications(result.data.notifications);
      })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar as notificações."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function markAsRead(notification: Notification) {
    setBusyId(notification.id); setError("");
    try {
      const response = await fetch(`/api/notifications/${notification.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: "{}" });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível atualizar a notificação.");
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, data: { ...item.data, read: true } } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível atualizar a notificação."); }
    finally { setBusyId(null); }
  }

  const dashboardHref = audience === "client" ? "/cliente/dashboard" : "/parceiro/dashboard";
  const description = audience === "client" ? "Acompanhe seus reparos, pagamentos e comunicados da plataforma." : "Acompanhe mudanças nas ordens, pagamentos e comunicados da plataforma.";

  return <main className={styles.page}><div className={styles.inner}>
    <header className={styles.header}><div><span className={styles.eyebrow}>CENTRAL DE ATUALIZAÇÕES</span><h1>Notificações</h1><p>{description}</p></div><div className={styles.summary}><BellIcon/><div><strong>{unread}</strong><span>{unread === 1 ? "não lida" : "não lidas"}</span></div></div></header>
    {error && <div className={styles.error} role="alert"><span>{error}</span><button type="button" onClick={() => void load()}>Tentar novamente</button></div>}
    <section className={styles.panel} aria-labelledby="notification-list-title">
      <div className={styles.panelHeader}><div><h2 id="notification-list-title">Sua atividade</h2><p>{notifications.length ? `${notifications.length} ${notifications.length === 1 ? "registro" : "registros"}` : "Atualizações da sua assistência"}</p></div></div>
      {loading ? <div className={styles.loading} role="status"><span/><span/><span/><p>Carregando notificações...</p></div>
        : notifications.length === 0 ? <div className={styles.empty}><span className={styles.emptyIcon}><BellIcon/></span><h3>Tudo em dia por aqui</h3><p>Quando houver uma atualização importante, ela aparecerá nesta central.</p><Link href={dashboardHref}>Voltar ao painel</Link></div>
        : <ul className={styles.list}>{notifications.map((notification) => <li key={notification.id} className={notification.data.read ? styles.read : styles.unread}><span className={styles.itemIcon}><BellIcon/></span><div className={styles.content}><div className={styles.meta}><span>{notification.data.read ? "Lida" : "Nova"}</span><time dateTime={notification.data.createdAt}>{new Date(notification.data.createdAt).toLocaleString("pt-BR")}</time></div><p>{notification.data.message}</p><div className={styles.actions}><Link href={notification.data.href}>Ver detalhes <span aria-hidden="true">→</span></Link>{!notification.data.read && <button type="button" disabled={busyId !== null} onClick={() => void markAsRead(notification)}>{busyId === notification.id ? "Atualizando..." : "Marcar como lida"}</button>}</div></div></li>)}</ul>}
    </section>
  </div></main>;
}
