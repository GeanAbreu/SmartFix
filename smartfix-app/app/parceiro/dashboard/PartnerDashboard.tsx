"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse, PartnerProfile } from "@/src/types/api";
import type { RepairOrder } from "@/src/types/workflow";
import { ORDER_LABELS } from "@/src/types/workflow";
import { readApiResponse } from "@/src/services/api-response.service";
import { summarizePartnerWork, type DashboardNotification } from "@/src/services/partner-dashboard.service";
import styles from "./dashboard.module.css";

type PartnerData = { partner: PartnerProfile };
type LoadState<T> = { data: T; error: string };

async function load<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  const result = await readApiResponse<T>(response);
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Não foi possível carregar os dados.");
  }
  return result.data;
}

function actionLabel(order: RepairOrder) {
  if (order.status === "pending") return "Preparar orçamento";
  if (order.status === "ready") return "Concluir ordem";
  return "Atualizar status";
}

export default function PartnerDashboard() {
  const router = useRouter();
  const [name, setName] = useState("Parceiro");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [orders, setOrders] = useState<LoadState<RepairOrder[]>>({ data: [], error: "" });
  const [notifications, setNotifications] = useState<LoadState<DashboardNotification[]>>({ data: [], error: "" });
  const [loading, setLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationAreaRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [orderResult, notificationResult] = await Promise.allSettled([
      load<{ orders: RepairOrder[] }>("/api/orders"),
      load<{ notifications: DashboardNotification[] }>("/api/notifications"),
    ]);
    setOrders(orderResult.status === "fulfilled"
      ? { data: orderResult.value.orders, error: "" }
      : { data: [], error: orderResult.reason instanceof Error ? orderResult.reason.message : "Não foi possível carregar as ordens." });
    setNotifications(notificationResult.status === "fulfilled"
      ? { data: notificationResult.value.notifications, error: "" }
      : { data: [], error: notificationResult.reason instanceof Error ? notificationResult.reason.message : "Não foi possível carregar as notificações." });
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/partners/me", { credentials: "include", cache: "no-store" });
        const result = await readApiResponse<PartnerData>(response) as ApiResponse<PartnerData>;
        if (!response.ok || !result.success) {
          router.replace(!result.success && result.redirectTo ? result.redirectTo : "/login");
          return;
        }
        if (active) {
          setName(result.data.partner.name || "Parceiro");
          setSessionLoading(false);
          await refresh();
        }
      } catch {
        if (active) router.replace("/login");
      }
    })();
    return () => { active = false; };
  }, [router, refresh]);

  useEffect(() => {
    if (!notificationsOpen) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !notificationAreaRef.current?.contains(event.target)) setNotificationsOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) { if (event.key === "Escape") setNotificationsOpen(false); }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissOnEscape);
    return () => { document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", dismissOnEscape); };
  }, [notificationsOpen]);

  if (sessionLoading) return <main className={styles.page}><p>Carregando painel...</p></main>;

  const summary = summarizePartnerWork(orders.data, notifications.data);
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <span className={styles.kicker}>SmartFix Parceiros</span>
            <h1>Olá, {name}</h1>
            <p>Acompanhe solicitações, orçamentos e reparos da sua assistência.</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.notificationArea} ref={notificationAreaRef}>
              <button type="button" className={styles.notificationButton} aria-label={summary.unread > 0 ? `Notificações, ${summary.unread} não lidas` : "Notificações"} aria-expanded={notificationsOpen} aria-controls="partner-notifications" title="Notificações" onClick={() => { setNotificationsOpen((open) => !open); if (!notificationsOpen && !loading) void refresh(); }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></svg>
                {summary.unread > 0 && <span className={styles.notificationCount}>{summary.unread > 9 ? "9+" : summary.unread}</span>}
              </button>
              {notificationsOpen && <section id="partner-notifications" className={styles.notificationPopover} aria-label="Notificações">
                <div className={styles.notificationHeader}><div><strong>Notificações</strong><span>{summary.unread > 0 ? `${summary.unread} não lida${summary.unread === 1 ? "" : "s"}` : "Tudo em dia"}</span></div><button type="button" aria-label="Fechar notificações" onClick={() => setNotificationsOpen(false)}>×</button></div>
                {loading ? <p className={styles.notificationMessage} role="status">Carregando notificações...</p>
                  : notifications.error ? <p className={styles.notificationMessage} role="alert">{notifications.error}</p>
                  : notifications.data.length === 0 ? <p className={styles.notificationMessage}>Você ainda não tem notificações.</p>
                  : <ul className={styles.notificationList}>{notifications.data.slice(0, 5).map((notification) => <li key={notification.id} className={notification.data.read ? styles.notificationRead : styles.notificationUnread}><p>{notification.data.message}</p><time dateTime={notification.data.createdAt}>{new Date(notification.data.createdAt).toLocaleString("pt-BR")}</time></li>)}</ul>}
                <Link className={styles.allNotifications} href="/parceiro/notificacoes" onClick={() => setNotificationsOpen(false)}>Ver todas as notificações →</Link>
              </section>}
            </div>
            <button type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "Atualizando..." : "Atualizar dados"}</button>
          </div>
        </header>
        <section aria-label="Indicadores" className={styles.metrics}>
          <div><strong>{loading ? "…" : orders.error ? "—" : summary.pending}</strong><span>Aguardando orçamento</span></div>
          <div><strong>{loading ? "…" : orders.error ? "—" : summary.awaitingApproval}</strong><span>Aguardando cliente</span></div>
          <div><strong>{loading ? "…" : orders.error ? "—" : summary.active}</strong><span>Em andamento</span></div>
          <div><strong>{loading ? "…" : notifications.error ? "—" : summary.unread}</strong><span>Notificações não lidas</span></div>
        </section>
        <div className={styles.columns}>
          <section className={styles.panel} aria-labelledby="requests-title">
            <div className={styles.sectionHeading}><div><h2 id="requests-title">Solicitações que precisam de atenção</h2><p>Ordens novas e reparos com próxima etapa disponível.</p></div><Link href="/parceiro/ordens">Ver todas as ordens</Link></div>
            {orders.error ? <div className={styles.error} role="alert">{orders.error} <button type="button" onClick={() => void refresh()}>Tentar novamente</button></div>
              : loading ? <p role="status">Carregando ordens...</p>
              : summary.requests.length === 0 ? <p className={styles.empty}>Nenhuma solicitação pendente no momento.</p>
              : <ul className={styles.list}>{summary.requests.map((order) => <li key={order.id}>
                  <div><span className={styles.status}>{ORDER_LABELS[order.status]}</span><h3>{order.device}</h3><p>{order.problem}</p><small>O.S. {order.id}</small></div>
                  <Link href={`/parceiro/ordens?order=${encodeURIComponent(order.id)}`}>{actionLabel(order)}</Link>
                </li>)}</ul>}
          </section>
          <section className={styles.panel} aria-labelledby="notifications-title">
            <div className={styles.sectionHeading}><h2 id="notifications-title">Notificações recentes</h2><Link href="/parceiro/notificacoes">Ver todas</Link></div>
            {notifications.error ? <div className={styles.error} role="alert">{notifications.error} <button type="button" onClick={() => void refresh()}>Tentar novamente</button></div>
              : loading ? <p role="status">Carregando notificações...</p>
              : notifications.data.length === 0 ? <p className={styles.empty}>Você ainda não recebeu notificações.</p>
              : <ul className={styles.notifications}>{notifications.data.slice(0, 5).map((notification) => <li key={notification.id}><span className={notification.data.read ? styles.read : styles.unread}>{notification.data.read ? "Lida" : "Nova"}</span><p>{notification.data.message}</p><small>{new Date(notification.data.createdAt).toLocaleString("pt-BR")}</small></li>)}</ul>}
          </section>
        </div>
      </div>
    </main>
  );
}
