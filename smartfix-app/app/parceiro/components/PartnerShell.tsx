"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { PartnerProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "@/app/cliente/components/client-shell.module.css";

type IconName = "home" | "orders" | "services" | "messages" | "finance" | "notifications" | "profile" | "network" | "tool" | "menu";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/parceiro/dashboard", label: "Início", icon: "home" },
  { href: "/parceiro/ordens", label: "Ordens de serviço", icon: "orders" },
  { href: "/parceiro/servicos", label: "Serviços", icon: "services" },
  { href: "/parceiro/mensagens", label: "Mensagens", icon: "messages" },
  { href: "/parceiro/financeiro", label: "Financeiro", icon: "finance" },
  { href: "/parceiro/notificacoes", label: "Notificações", icon: "notifications" },
  { href: "/parceiro/perfil", label: "Minha assistência", icon: "profile" },
  { href: "/parceiro/parceiros", label: "Rede de assistências", icon: "network" },
];

const iconPaths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  orders: <><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></>,
  services: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  messages: <path d="M4 5h16v11H8l-4 4V5Z"/>,
  finance: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h18M16 15h2"/></>,
  notifications: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>,
  profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  network: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m11 7-5 9m7-9 5 9M7 18h10"/></>,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5L20 16.4 16.4 20l-7.7-7.7a4 4 0 0 0-5-5l2.1 2.1"/>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
};

function Icon({ name }: { name: IconName }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

function initialsFor(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF";
}

export default function PartnerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/partners/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => {
        const result = await readApiResponse<{ partner: PartnerProfile }>(response);
        if (active && response.ok && result.success) setProfile(result.data.partner);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onEscape(event: KeyboardEvent) { if (event.key === "Escape") setMenuOpen(false); }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      const result = await readApiResponse(response);
      if (!response.ok || !result.success) throw new Error(result.message || "Não foi possível sair da conta.");
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "Não foi possível sair da conta.");
      setLoggingOut(false);
    }
  }

  const name = profile?.companyName?.trim() || profile?.name?.trim() || "Parceiro SmartFix";

  return <div className={styles.shell}>
    {menuOpen && <button type="button" className={styles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <aside id="partner-sidebar" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
      <Link href="/parceiro/dashboard" className={styles.logo} onClick={() => setMenuOpen(false)}><span className={styles.logoMark}><Icon name="tool" /></span><strong>SMART<span>FIX</span></strong></Link>
      <div className={styles.profile}><span className={styles.avatar}>{initialsFor(name)}</span><div><strong>{name}</strong><small>Parceiro</small></div></div>
      <nav className={styles.navigation} aria-label="Navegação do parceiro">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon name={icon} /><span>{label}</span></Link>;
        })}
      </nav>
      <div className={styles.footer}><button type="button" onClick={() => void logout()} disabled={loggingOut} aria-busy={loggingOut}>{loggingOut ? "Saindo..." : "Sair da conta"}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>
    </aside>
    <div className={styles.workspace}>
      <div className={styles.mobileBar}><button type="button" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="partner-sidebar" onClick={() => setMenuOpen(true)}><Icon name="menu" /></button><Link href="/parceiro/dashboard">SMART<span>FIX</span></Link></div>
      {children}
    </div>
  </div>;
}
