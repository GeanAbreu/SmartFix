"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiResponse, ClientProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import { summarizeClientOrders } from "@/src/services/client-dashboard.service";
import { ORDER_LABELS, type RepairOrder } from "@/src/types/workflow";
import styles from "./dashboard.module.css";

type ClientData = { client: ClientProfile };

type OrdersData = { orders: RepairOrder[] };

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

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

  if (sessionLoading) return <main className={styles.loadingPage}><div className={styles.loadingBox}><strong>SMART<span>FIX</span></strong><p>Validando seu acesso...</p></div></main>;

  const name = client?.nome?.trim() || "Cliente SmartFix";
  const firstName = name.split(" ").filter(Boolean)[0] || "Cliente";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const summary = summarizeClientOrders(orders);

  return <main className={styles.dashboardPage}>
    {sidebarOpen && <button type="button" className={styles.mobileOverlay} aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}
    <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
      <Link href="/cliente/dashboard" className={styles.logo}>🔧 <strong>SMART<span>FIX</span></strong></Link>
      <div className={styles.profile}><span className={styles.avatar}>{initials}</span><div><strong>{name}</strong><small>Cliente</small></div></div>
      <nav className={styles.navigation} aria-label="Navegação do cliente">
        <Link href="/cliente/dashboard" className={styles.navActive} aria-current="page">Início</Link>
        <Link href="/cliente/ordens">Meus reparos</Link>
        <Link href="/cliente/dispositivos">Meus dispositivos</Link>
        <Link href="/cliente/solicitar-reparo">Solicitar reparo</Link>
        <Link href="/cliente/assistencias">Assistências</Link>
        <Link href="/cliente/enderecos">Meus endereços</Link>
        <Link href="/cliente/notificacoes">Notificações</Link>
        <Link href="/cliente/ajuda">Ajuda</Link>
        <Link href="/cliente/perfil">Meu perfil</Link>
      </nav>
      <div className={styles.sidebarFooter}><Link href="/cliente/ajuda">Precisa de ajuda?</Link><button type="button" onClick={() => void logout()} disabled={isLoggingOut} aria-busy={isLoggingOut}>{isLoggingOut ? "Saindo..." : "Sair da conta"}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>
    </aside>

    <section className={styles.mainArea}>
      <header className={styles.topbar}>
        <button type="button" className={styles.menuButton} onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">☰</button>
        <div><span className={styles.eyebrow}>ÁREA DO CLIENTE</span><h1>Olá, {firstName}</h1><p>Acompanhe seus reparos e veja o que precisa da sua atenção.</p></div>
        <div className={styles.topbarActions}>
          <Link href="/cliente/notificacoes" className={styles.notificationLink} aria-label="Notificações" title="Notificações"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" /><path d="M10 21h4" /></svg></Link>
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
