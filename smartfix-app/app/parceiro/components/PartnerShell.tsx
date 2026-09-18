"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { PartnerProfile } from "@/src/types/api";
import { readApiResponse } from "@/src/services/api-response.service";
import styles from "@/app/cliente/components/client-shell.module.css";

const links = [
  { href: "/parceiro/dashboard", label: "Início" },
  { href: "/parceiro/ordens", label: "Ordens de serviço" },
  { href: "/parceiro/servicos", label: "Serviços" },
  { href: "/parceiro/notificacoes", label: "Notificações" },
];

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
      <Link href="/parceiro/dashboard" className={styles.logo} onClick={() => setMenuOpen(false)}>🔧 <strong>SMART<span>FIX</span></strong></Link>
      <div className={styles.profile}><span className={styles.avatar}>{initialsFor(name)}</span><div><strong>{name}</strong><small>Parceiro</small></div></div>
      <nav className={styles.navigation} aria-label="Navegação do parceiro">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return <Link key={href} href={href} className={active ? styles.active : undefined} aria-current={active ? "page" : undefined} onClick={() => setMenuOpen(false)}>{label}</Link>;
        })}
      </nav>
      <div className={styles.footer}><a href="/api/auth/google?link=true">Vincular Google</a><button type="button" onClick={() => void logout()} disabled={loggingOut} aria-busy={loggingOut}>{loggingOut ? "Saindo..." : "Sair da conta"}</button>{logoutError && <p role="alert">{logoutError}</p>}</div>
    </aside>
    <div className={styles.workspace}>
      <div className={styles.mobileBar}><button type="button" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="partner-sidebar" onClick={() => setMenuOpen(true)}>☰</button><Link href="/parceiro/dashboard">SMART<span>FIX</span></Link></div>
      {children}
    </div>
  </div>;
}
