"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível sair da conta.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Não foi possível sair da conta.");
      setIsLoggingOut(false);
    }
  }

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
          <button type="button" onClick={() => void refresh()} disabled={loading}> {loading ? "Atualizando..." : "Atualizar dados"}</button>
        </header>
        <nav className={styles.nav} aria-label="Área do parceiro">
          <Link href="/parceiro/ordens">Ordens de serviço</Link>
          <Link href="/parceiro/servicos">Serviços</Link>
          <Link href="/parceiro/notificacoes">Notificações{!notifications.error && summary.unread > 0 ? ` (${summary.unread})` : ""}</Link>
          <a href="/api/auth/google?link=true">Vincular Google</a>
          <button type="button" onClick={() => void logout()} disabled={isLoggingOut}>{isLoggingOut ? "Saindo..." : "Sair da conta"}</button>
        </nav>
        {logoutError && <p className={styles.error} role="alert">{logoutError}</p>}
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
