"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { ClientProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./client-shell.module.css";

type IconName = "home" | "add" | "orders" | "devices" | "location" | "reviews" | "address" | "bell" | "profile" | "help" | "tool" | "menu";
const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/cliente/dashboard", label: "Início", icon: "home" },
  { href: "/cliente/solicitar-reparo", label: "Solicitar reparo", icon: "add" },
  { href: "/cliente/ordens", label: "Meus reparos", icon: "orders" },
  { href: "/cliente/dispositivos", label: "Meus dispositivos", icon: "devices" },
  { href: "/cliente/assistencias", label: "Assistências", icon: "location" },
  { href: "/cliente/avaliacoes", label: "Minhas avaliações", icon: "reviews" },
  { href: "/cliente/enderecos", label: "Meus endereços", icon: "address" },
  { href: "/cliente/notificacoes", label: "Notificações", icon: "bell" },
  { href: "/cliente/perfil", label: "Meu perfil", icon: "profile" },
  { href: "/cliente/ajuda", label: "Ajuda", icon: "help" },
];

const iconPaths: Record<IconName, ReactNode> = {
  home:<><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>, add:<><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>, orders:<><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/></>, devices:<><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/></>, location:<><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>, reviews:<><path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/></>, address:<><path d="M3 10 12 3l9 7v10H3Z"/><path d="M8 20v-7h8v7"/></>, bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 21h4"/></>, profile:<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>, help:<><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.8M12 17h.01"/></>, tool:<path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5L20 16.4 16.4 20l-7.7-7.7"/>, menu:<path d="M4 7h16M4 12h16M4 17h16"/>,
};
function Icon({ name }: { name: IconName }) { return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>; }

function initialsFor(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SF";
}

export default function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/clients/me", { credentials: "include", cache: "no-store" });
        const result = await readApiResponse<{ client: ClientProfile }>(response);
        if (active && response.ok && result.success) setProfile(result.data.client);
      } catch { /* The page owns its loading and error state. */ }
    }
    void load();
    function refreshProfile() { void load(); }
    window.addEventListener("smartfix:profile-updated", refreshProfile);
    return () => { active = false; window.removeEventListener("smartfix:profile-updated", refreshProfile); };
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

  const name = profile?.nome?.trim() || "Cliente SmartFix";

  return <div className={styles.shell}>
    {menuOpen && <button type="button" className={styles.overlay} aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    <aside id="client-sidebar" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}>
      <Link href="/cliente/dashboard" className={styles.logo} onClick={() => setMenuOpen(false)}><span className={styles.logoMark}><Icon name="tool" /></span><strong>SMART<span>FIX</span></strong></Link>
      <div className={styles.profile}><span className={styles.avatar}>{initialsFor(name)}</span><div><strong>{name}</strong><small>Cliente</small></div></div>
      <nav className={styles.navigation} aria-label="Navegação do cliente">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}><Icon name={icon}/><span>{label}</span></Link>;
        })}
      </nav>
      <div className={styles.footer}><button type="button" onClick={() => void logout()} disabled={loggingOut} aria-busy={loggingOut}>{loggingOut ? "Saindo..." : "Sair da conta"}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>
    </aside>
    <div className={styles.workspace}>
      <div className={styles.mobileBar}><button type="button" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="client-sidebar" onClick={() => setMenuOpen(true)}><Icon name="menu"/></button><Link href="/cliente/dashboard">SMART<span>FIX</span></Link></div>
      {children}
    </div>
  </div>;
}
