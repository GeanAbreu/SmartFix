"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse, ClientProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import { summarizeClientOrders } from "@/src/services/client-dashboard.service";
import { ORDER_LABELS, type RepairOrder } from "@/src/types/workflow";
import styles from "./dashboard.module.css";

type ClientData = { client: ClientProfile };

type OrdersData = { orders: RepairOrder[] };
type Notification = { id: string; data: { message: string; href: string; read: boolean; createdAt: string } };
type NotificationsData = { notifications: Notification[] };

function orderAction(order: RepairOrder) {
  if (order.status === "quoted") return "Revisar orçamento";
  if (order.status === "ready") return "Ver retirada";
  if (order.status === "completed" && !order.review) return "Avaliar reparo";
  return "Ver detalhes";
}

function statusStyle(order: RepairOrder) {
  if (order.status === "completed") return styles.statusComplete;
  if (order.status === "cancelled") return styles.statusCancelled;
  if (order.status === "quoted" || order.status === "ready") return styles.statusAttention;
  return styles.statusActive;
}

function OrderRow({ order }: { order: RepairOrder }) {
  return <li className={styles.orderRow}>
    <div className={styles.orderDetails}>
      <span className={styles.orderIcon} aria-hidden="true">▣</span>
      <div>
        <h3>{order.device}</h3>
        <p>O.S. {order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString("pt-BR")}</p>
      </div>
    </div>
    <span className={`${styles.statusBadge} ${statusStyle(order)}`}>{ORDER_LABELS[order.status]}</span>
    <Link href={`/cliente/ordens?q=${encodeURIComponent(order.id)}`}>{orderAction(order)} →</Link>
  </li>;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState("");
  const [notificationActionError, setNotificationActionError] = useState("");
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const notificationAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/clients/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<ClientData>(response) as ApiResponse<ClientData>;
        if (!response.ok || !result.success) {
          router.replace(!result.success && result.redirectTo ? result.redirectTo : "/login");
          return;
        }
        if (active) { setClient(result.data.client); setSessionLoading(false); }
      })
      .catch(() => { if (active) router.replace("/login"); });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    let active = true;
    void fetch("/api/orders", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<OrdersData>(response);
        if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os reparos.");
        if (active) { setOrders(result.data.orders); setOrdersError(""); }
      })
      .catch((error: unknown) => { if (active) setOrdersError(error instanceof Error ? error.message : "Não foi possível carregar os reparos."); })
      .finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<NotificationsData>(response);
        if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as notificações.");
        if (active) { setNotifications(result.data.notifications); setNotificationsError(""); }
      })
      .catch((error: unknown) => { if (active) setNotificationsError(error instanceof Error ? error.message : "Não foi possível carregar as notificações."); })
      .finally(() => { if (active) setNotificationsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !notificationAreaRef.current?.contains(event.target)) setNotificationsOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [notificationsOpen]);

  async function refreshNotifications() {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch("/api/notifications", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<NotificationsData>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar as notificações.");
      setNotifications(result.data.notifications);
    } catch (error) {
      setNotificationsError(error instanceof Error ? error.message : "Não foi possível carregar as notificações.");
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function markNotificationRead(id: string) {
    setMarkingNotificationId(id);
    setNotificationActionError("");
    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: "PATCH", credentials: "include" });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível marcar a notificação como lida.");
      setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, data: { ...notification.data, read: true } } : notification));
    } catch (error) {
      setNotificationActionError(error instanceof Error ? error.message : "Não foi possível marcar a notificação como lida.");
    } finally {
      setMarkingNotificationId(null);
    }
  }

  async function retryOrders() {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const response = await fetch("/api/orders", { credentials: "include", cache: "no-store" });
      const result = await readApiResponse<OrdersData>(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível carregar os reparos.");
      setOrders(result.data.orders);
    } catch (error) {
      setOrdersError(error instanceof Error ? error.message : "Não foi possível carregar os reparos.");
    } finally {
      setOrdersLoading(false);
    }
  }

  if (sessionLoading) return <main className={styles.loadingPage}><div className={styles.loadingBox}><strong>SMART<span>FIX</span></strong><p>Validando seu acesso...</p></div></main>;

  const name = client?.nome?.trim() || "Cliente SmartFix";
  const firstName = name.split(" ").filter(Boolean)[0] || "Cliente";
  const summary = summarizeClientOrders(orders);
  const unreadNotifications = notifications.filter((notification) => !notification.data.read).length;

  return <main className={styles.dashboardPage}>
    <section className={styles.mainArea}>
      <header className={styles.topbar}>
        <div><span className={styles.eyebrow}>ÁREA DO CLIENTE</span><h1>Olá, {firstName}</h1><p>Acompanhe seus reparos e veja o que precisa da sua atenção.</p></div>
        <div className={styles.topbarActions}>
          <div className={styles.notificationArea} ref={notificationAreaRef}>
            <button type="button" className={styles.notificationButton} aria-label={unreadNotifications > 0 ? `Notificações, ${unreadNotifications} não lidas` : "Notificações"} aria-expanded={notificationsOpen} aria-controls="client-notifications" title="Notificações" onClick={() => { setNotificationsOpen((open) => !open); if (!notificationsOpen && !notificationsLoading) void refreshNotifications(); }}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></svg>
              {unreadNotifications > 0 && <span className={styles.notificationCount}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</span>}
            </button>
            {notificationsOpen && <section id="client-notifications" className={styles.notificationPopover} aria-label="Notificações">
              <div className={styles.notificationHeader}><div><strong>Notificações</strong><span>{unreadNotifications > 0 ? `${unreadNotifications} não lida${unreadNotifications === 1 ? "" : "s"}` : "Tudo em dia"}</span></div><button type="button" aria-label="Fechar notificações" onClick={() => setNotificationsOpen(false)}>×</button></div>
              {notificationsLoading ? <p className={styles.notificationMessage} role="status">Carregando notificações...</p>
                : notificationsError ? <div className={styles.notificationMessage} role="alert"><p>{notificationsError}</p><button type="button" onClick={() => void refreshNotifications()}>Tentar novamente</button></div>
                : notifications.length === 0 ? <p className={styles.notificationMessage}>Você ainda não tem notificações.</p>
                : <ul className={styles.notificationList}>{notifications.map((notification) => <li key={notification.id} className={notification.data.read ? styles.notificationRead : styles.notificationUnread}>
                  <p>{notification.data.message}</p>
                  <time dateTime={notification.data.createdAt}>{new Date(notification.data.createdAt).toLocaleString("pt-BR")}</time>
                  <div className={styles.notificationItemActions}>
                    {!notification.data.read && <button type="button" disabled={markingNotificationId === notification.id} onClick={() => void markNotificationRead(notification.id)}>{markingNotificationId === notification.id ? "Marcando..." : "Marcar como lida"}</button>}
                    {notification.data.href.startsWith("/") && !notification.data.href.startsWith("//") && <Link href={notification.data.href}>Abrir →</Link>}
                  </div>
                </li>)}</ul>}
              {notificationActionError && <p className={styles.notificationActionError} role="alert">{notificationActionError}</p>}
            </section>}
          </div>
          <Link href="/cliente/solicitar-reparo" className={styles.primaryAction}>+ Solicitar reparo</Link>
        </div>
      </header>

      <section className={styles.statsGrid} aria-label="Resumo dos reparos">
        <article className={styles.statCard}><span>Em andamento</span><strong>{ordersLoading || ordersError ? "—" : summary.active}</strong><p>Pedidos ativos</p></article>
        <article className={styles.statCard}><span>Aguardando aprovação</span><strong>{ordersLoading || ordersError ? "—" : summary.awaitingApproval}</strong><p>Orçamentos para revisar</p></article>
        <article className={styles.statCard}><span>Concluídos</span><strong>{ordersLoading || ordersError ? "—" : summary.completed}</strong><p>Reparos finalizados</p></article>
      </section>

      {ordersLoading ? <section className={styles.panel} role="status"><p className={styles.message}>Carregando reparos...</p></section>
      : ordersError ? <section className={styles.panel} role="alert"><p className={styles.message}>{ordersError}</p><button type="button" className={styles.retryButton} onClick={() => void retryOrders()}>Tentar novamente</button></section>
      : orders.length === 0 ? <section className={styles.panel}><div className={styles.emptyState}><span aria-hidden="true">▣</span><h2>Seu primeiro reparo começa aqui</h2><p>Cadastre um aparelho e envie uma solicitação para uma assistência parceira.</p><Link href="/cliente/solicitar-reparo" className={styles.primaryAction}>Solicitar reparo</Link></div></section>
      : <>
        {summary.attentionCount > 0 && <section className={styles.panel} aria-labelledby="attention-title">
          <div className={styles.panelHeader}><div><span className={styles.eyebrow}>PRÓXIMOS PASSOS</span><h2 id="attention-title">Precisa da sua atenção</h2></div><Link href="/cliente/ordens">Ver todos</Link></div>
          <ul className={styles.orderList}>{summary.attention.map((order) => <OrderRow key={order.id} order={order} />)}</ul>
        </section>}
        {summary.recent.length > 0 && <section className={styles.panel} aria-labelledby="recent-title">
          <div className={styles.panelHeader}><div><span className={styles.eyebrow}>ACOMPANHAMENTO</span><h2 id="recent-title">Reparos recentes</h2></div><Link href="/cliente/ordens">Ver todos</Link></div>
          <ul className={styles.orderList}>{summary.recent.map((order) => <OrderRow key={order.id} order={order} />)}</ul>
        </section>}
      </>}
    </section>
  </main>;
}
