"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { ClientProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "./client-shell.module.css";

const links = [
  { href: "/cliente/dashboard", label: "Início" },
  { href: "/cliente/ordens", label: "Meus reparos" },
  { href: "/cliente/dispositivos", label: "Meus dispositivos" },
  { href: "/cliente/solicitar-reparo", label: "Solicitar reparo" },
  { href: "/cliente/assistencias", label: "Assistências" },
  { href: "/cliente/enderecos", label: "Meus endereços" },
  { href: "/cliente/ajuda", label: "Ajuda" },
  { href: "/cliente/perfil", label: "Meu perfil" },
];

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
      <Link href="/cliente/dashboard" className={styles.logo} onClick={() => setMenuOpen(false)}>🔧 <strong>SMART<span>FIX</span></strong></Link>
      <div className={styles.profile}><span className={styles.avatar}>{initialsFor(name)}</span><div><strong>{name}</strong><small>Cliente</small></div></div>
      <nav className={styles.navigation} aria-label="Navegação do cliente">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>{label}</Link>;
        })}
      </nav>
      <div className={styles.footer}><Link href="/cliente/ajuda" onClick={() => setMenuOpen(false)}>Precisa de ajuda?</Link><button type="button" onClick={() => void logout()} disabled={loggingOut} aria-busy={loggingOut}>{loggingOut ? "Saindo..." : "Sair da conta"}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>
    </aside>
    <div className={styles.workspace}>
      <div className={styles.mobileBar}><button type="button" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="client-sidebar" onClick={() => setMenuOpen(true)}>☰</button><Link href="/cliente/dashboard">SMART<span>FIX</span></Link></div>
      {children}
    </div>
  </div>;
}
